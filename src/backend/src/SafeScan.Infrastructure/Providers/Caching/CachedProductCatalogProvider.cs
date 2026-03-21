using Microsoft.Extensions.Caching.Memory;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;

namespace SafeScan.Infrastructure.Providers.Caching;

public sealed class CachedProductCatalogProvider : IProductCatalogProvider
{
    private static readonly TimeSpan AllergenCacheDuration = TimeSpan.FromHours(12);
    private static readonly TimeSpan ProductCacheDuration = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan SearchCacheDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan PreviewCacheDuration = TimeSpan.FromMinutes(10);
    private const int PreviewEnrichmentCount = 3;

    private readonly IProductCatalogSource _innerProvider;
    private readonly IMemoryCache _cache;
    private readonly IProductAnalysisService _analysisService;
    private readonly SearchQueryNormalizer _queryNormalizer;

    public CachedProductCatalogProvider(
        IProductCatalogSource innerProvider,
        IMemoryCache cache,
        IProductAnalysisService analysisService,
        SearchQueryNormalizer queryNormalizer)
    {
        _innerProvider = innerProvider;
        _cache = cache;
        _analysisService = analysisService;
        _queryNormalizer = queryNormalizer;
    }

    public Task<IReadOnlyList<AllergenOptionDto>> GetAllergensAsync(CancellationToken cancellationToken = default)
    {
        return _cache.GetOrCreateAsync(
            "reference:allergens",
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = AllergenCacheDuration;
                return await _innerProvider.GetAllergensAsync(cancellationToken);
            })!;
    }

    public Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default)
    {
        var normalizedGtin = _queryNormalizer.NormalizeGtin(gtin);

        if (normalizedGtin.Length == 0)
        {
            return Task.FromResult<ProductRecord?>(null);
        }

        return _cache.GetOrCreateAsync(
            $"product:gtin:{normalizedGtin}",
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = ProductCacheDuration;
                return await _innerProvider.GetProductByGtinAsync(normalizedGtin, cancellationToken);
            })!;
    }

    public async Task<IReadOnlyList<SearchResultDto>> SearchProductsAsync(
        string query,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken = default)
    {
        var normalizedQuery = _queryNormalizer.NormalizeQuery(query);

        if (normalizedQuery.Length == 0)
        {
            return [];
        }

        var selectedAllergenKey = _queryNormalizer.NormalizeSelectedAllergens(selectedAllergens);
        var cacheKey = $"search:{normalizedQuery}:allergens:{selectedAllergenKey}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = SearchCacheDuration;

                var results = await _innerProvider.SearchProductsAsync(normalizedQuery, selectedAllergens, cancellationToken);
                return await EnrichResultsAsync(results, selectedAllergens, cancellationToken);
            })
            ?? [];
    }

    private async Task<IReadOnlyList<SearchResultDto>> EnrichResultsAsync(
        IReadOnlyList<SearchResultDto> results,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken)
    {
        if (results.Count == 0)
        {
            return results;
        }

        var enrichedResults = new SearchResultDto[results.Count];

        for (var index = 0; index < results.Count; index++)
        {
            enrichedResults[index] = index < PreviewEnrichmentCount
                ? await EnrichResultAsync(results[index], selectedAllergens, cancellationToken)
                : results[index];
        }

        return enrichedResults;
    }

    private async Task<SearchResultDto> EnrichResultAsync(
        SearchResultDto result,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken)
    {
        if (result.PreviewStatus is not null && result.PreviewBadge is not null && result.PreviewNote is not null)
        {
            return result;
        }

        var selectedAllergenKey = _queryNormalizer.NormalizeSelectedAllergens(selectedAllergens);
        var cacheKey = $"search-preview:{result.Gtin}:allergens:{selectedAllergenKey}";

        var preview = await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = PreviewCacheDuration;

                var product = await GetProductByGtinAsync(result.Gtin, cancellationToken);

                if (product is null)
                {
                    return null;
                }

                var analysis = _analysisService.Analyze(product, selectedAllergens);
                return new PreviewEnrichment(
                    analysis.OverallStatus,
                    BuildPreviewBadge(analysis.OverallStatus),
                    analysis.Explanations.FirstOrDefault() ?? "Preview analysis is available for this product.");
            });

        if (preview is null)
        {
            return result;
        }

        return result with
        {
            PreviewStatus = result.PreviewStatus ?? preview.Status,
            PreviewBadge = result.PreviewBadge ?? preview.Badge,
            PreviewNote = result.PreviewNote ?? preview.Note,
        };
    }

    private static string BuildPreviewBadge(AnalysisOverallStatus status)
    {
        return status switch
        {
            AnalysisOverallStatus.Contains => "Contains allergens",
            AnalysisOverallStatus.MayContain => "Trace warning",
            AnalysisOverallStatus.Safe => "Profile match safe",
            _ => "Review product",
        };
    }

    private sealed record PreviewEnrichment(AnalysisOverallStatus Status, string Badge, string Note);
}
