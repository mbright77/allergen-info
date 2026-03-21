using SafeScan.Application.Contracts;

namespace SafeScan.Application.Abstractions;

public interface IProductCatalogSource
{
    Task<IReadOnlyList<AllergenOptionDto>> GetAllergensAsync(CancellationToken cancellationToken = default);

    Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SearchResultDto>> SearchProductsAsync(
        string query,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken = default);
}
