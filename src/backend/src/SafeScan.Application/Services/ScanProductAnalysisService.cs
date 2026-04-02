using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;

namespace SafeScan.Application.Services;

public sealed class ScanProductAnalysisService : IScanProductAnalysisService
{
    private const string BasicFallbackMessage = "No allergen info found. Showing basic product information only.";
    private const string NotFoundMessage = "No product was found for this barcode.";

    private readonly IProductCatalogProvider _provider;
    private readonly IProductAnalysisService _analysisService;

    public ScanProductAnalysisService(IProductCatalogProvider provider, IProductAnalysisService analysisService)
    {
        _provider = provider;
        _analysisService = analysisService;
    }

    public async Task<ScanAnalysisResponse> AnalyzeScanAsync(ScanAnalysisRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedCode = request.Code?.Trim() ?? string.Empty;
        var selectedAllergens = request.SelectedAllergens ?? [];

        if (normalizedCode.Length == 0)
        {
            return new ScanAnalysisResponse(
                new ScanResolutionDto(ScanResolutionMode.NotFound, normalizedCode, null, NotFoundMessage),
                null,
                null);
        }

        var searchResults = await _provider.SearchProductsAsync(normalizedCode, selectedAllergens, cancellationToken);
        var resolvedResult = searchResults.FirstOrDefault();

        if (resolvedResult is null)
        {
            return new ScanAnalysisResponse(
                new ScanResolutionDto(ScanResolutionMode.NotFound, normalizedCode, null, NotFoundMessage),
                null,
                null);
        }

        var product = await _provider.GetProductByGtinAsync(resolvedResult.Gtin, cancellationToken);

        if (product is not null)
        {
            return new ScanAnalysisResponse(
                new ScanResolutionDto(ScanResolutionMode.Full, normalizedCode, product.Gtin, null),
                product.ToDto(),
                _analysisService.Analyze(product, selectedAllergens));
        }

        var fallbackProduct = BuildFallbackProduct(resolvedResult);
        return new ScanAnalysisResponse(
            new ScanResolutionDto(ScanResolutionMode.Basic, normalizedCode, fallbackProduct.Gtin, BasicFallbackMessage),
            fallbackProduct.ToDto(),
            BuildFallbackAnalysis(selectedAllergens));
    }

    private static ProductRecord BuildFallbackProduct(SearchResultDto result)
    {
        return new ProductRecord(
            result.Gtin,
            result.Name,
            result.Brand,
            result.Category,
            result.Subtitle,
            "Detailed ingredients were unavailable for this product.",
            [],
            [],
            [],
            null,
            null,
            result.Source,
            result.PreviewBadge,
            result.PreviewNote);
    }

    private static AnalysisResultDto BuildFallbackAnalysis(IReadOnlyCollection<string> selectedAllergens)
    {
        var normalizedSelections = selectedAllergens
            .Where(static allergen => !string.IsNullOrWhiteSpace(allergen))
            .Select(static allergen => allergen.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new AnalysisResultDto(
            AnalysisOverallStatus.Unknown,
            [],
            [],
            normalizedSelections.Select(static allergen => new CheckedAllergenDto(allergen, AllergenMatchStatus.Unknown)).ToArray(),
            [],
            [BasicFallbackMessage]);
    }
}
