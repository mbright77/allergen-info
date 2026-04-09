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
    private const int PreviewEnrichmentCount = 20;
    private const int PreviewEnrichmentBatchSize = 5;

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

    public async Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default)
    {
        var normalizedGtin = _queryNormalizer.NormalizeGtin(gtin);

        if (normalizedGtin.Length == 0)
        {
            return null;
        }

        var cacheKey = $"product:gtin:{normalizedGtin}";

        if (_cache.TryGetValue(cacheKey, out ProductRecord? cachedProduct))
        {
            return cachedProduct;
        }

        var product = await _innerProvider.GetProductByGtinAsync(normalizedGtin, cancellationToken);

        if (product is not null)
        {
            _cache.Set(cacheKey, product, ProductCacheDuration);
        }

        return product;
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
                return await EnrichResultsAsync(results, normalizedQuery, selectedAllergens, cancellationToken);
            })
            ?? [];
    }

    private async Task<IReadOnlyList<SearchResultDto>> EnrichResultsAsync(
        IReadOnlyList<SearchResultDto> results,
        string normalizedQuery,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken)
    {
        if (results.Count == 0)
        {
            return results;
        }

        var enrichedResults = results.ToArray();
        var enrichableIndexes = new List<int>();

        for (var index = 0; index < results.Count; index++)
        {
            if (ShouldEnrichResult(results[index], index, normalizedQuery))
            {
                enrichableIndexes.Add(index);
            }
        }

        for (var batchStart = 0; batchStart < enrichableIndexes.Count; batchStart += PreviewEnrichmentBatchSize)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var batchIndexes = enrichableIndexes
                .Skip(batchStart)
                .Take(PreviewEnrichmentBatchSize)
                .ToArray();

            var enrichedBatch = await Task.WhenAll(
                batchIndexes.Select(index => EnrichResultAsync(results[index], selectedAllergens, cancellationToken)));

            for (var index = 0; index < batchIndexes.Length; index++)
            {
                enrichedResults[batchIndexes[index]] = enrichedBatch[index];
            }
        }

        return enrichedResults;
    }

    private bool ShouldEnrichResult(SearchResultDto result, int index, string normalizedQuery)
    {
        if (index < PreviewEnrichmentCount)
        {
            return true;
        }

        if (result.Gtin.Equals(normalizedQuery, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(result.ArticleNumber)
            && result.ArticleNumber.Equals(normalizedQuery, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<SearchResultDto> EnrichResultAsync(
        SearchResultDto result,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken)
    {
        var selectedAllergenKey = _queryNormalizer.NormalizeSelectedAllergens(selectedAllergens);
        var cacheKey = $"search-enrichment:{result.Gtin}:allergens:{selectedAllergenKey}";

        var enrichment = await _cache.GetOrCreateAsync(
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
                return new SearchEnrichment(
                    product.ImageUrl,
                    analysis.OverallStatus,
                    BuildPreviewBadge(analysis.OverallStatus),
                    analysis.Explanations.FirstOrDefault() ?? "Preview analysis is available for this product.");
            });

        if (enrichment is null)
        {
            return result;
        }

        return result with
        {
            ImageUrl = result.ImageUrl ?? enrichment.ImageUrl,
            PreviewStatus = result.PreviewStatus ?? enrichment.Status,
            PreviewBadge = result.PreviewBadge ?? enrichment.Badge,
            PreviewNote = result.PreviewNote ?? enrichment.Note,
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

    private sealed record SearchEnrichment(string? ImageUrl, AnalysisOverallStatus Status, string Badge, string Note);
}
