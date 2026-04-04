using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;

namespace SafeScan.Application.Services;

public sealed class ScanProductAnalysisService : IScanProductAnalysisService
{
    private const string BasicFallbackMessage = "We found a possible product match, but detailed allergen data was unavailable. Treat this result as unknown.";
    private const string NotFoundMessage = "No product was found for this barcode.";
    private const string UnverifiedMatchMessage = "This barcode did not resolve to a verified GTIN match. The product was found via search only, so the status is unknown.";

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

        var directProduct = await _provider.GetProductByGtinAsync(normalizedCode, cancellationToken);

        if (directProduct is not null)
        {
            return new ScanAnalysisResponse(
                new ScanResolutionDto(ScanResolutionMode.Full, normalizedCode, directProduct.Gtin, null),
                directProduct.ToDto(),
                _analysisService.Analyze(directProduct, selectedAllergens));
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
            if (IsVerifiedResolvedGtin(normalizedCode, resolvedResult.Gtin))
            {
                return new ScanAnalysisResponse(
                    new ScanResolutionDto(ScanResolutionMode.Full, normalizedCode, product.Gtin, null),
                    product.ToDto(),
                    _analysisService.Analyze(product, selectedAllergens));
            }

            return BuildUnknownResponse(
                ScanResolutionMode.Unverified,
                normalizedCode,
                product.Gtin,
                product,
                selectedAllergens,
                UnverifiedMatchMessage);
        }

        var fallbackProduct = BuildFallbackProduct(resolvedResult);
        return BuildUnknownResponse(
            ScanResolutionMode.Basic,
            normalizedCode,
            fallbackProduct.Gtin,
            fallbackProduct,
            selectedAllergens,
            BasicFallbackMessage);
    }

    private static ScanAnalysisResponse BuildUnknownResponse(
        ScanResolutionMode resolutionMode,
        string scannedCode,
        string? resolvedGtin,
        ProductRecord product,
        IReadOnlyCollection<string> selectedAllergens,
        string message)
    {
        return new ScanAnalysisResponse(
            new ScanResolutionDto(resolutionMode, scannedCode, resolvedGtin, message),
            product.ToDto(),
            BuildFallbackAnalysis(selectedAllergens, message));
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
            [],
            null,
            null,
            result.Source,
            result.PreviewBadge,
            result.PreviewNote);
    }

    private static bool IsVerifiedResolvedGtin(string scannedCode, string? resolvedGtin)
    {
        if (string.IsNullOrWhiteSpace(scannedCode) || string.IsNullOrWhiteSpace(resolvedGtin))
        {
            return false;
        }

        if (resolvedGtin.Equals(scannedCode, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return NormalizeComparableGtin(scannedCode).Equals(NormalizeComparableGtin(resolvedGtin), StringComparison.Ordinal);
    }

    private static string NormalizeComparableGtin(string gtin)
    {
        var normalized = gtin.Trim();
        var trimmed = normalized.TrimStart('0');
        return trimmed.Length == 0 ? "0" : trimmed;
    }

    private static AnalysisResultDto BuildFallbackAnalysis(IReadOnlyCollection<string> selectedAllergens, string message)
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
            [message]);
    }
}
