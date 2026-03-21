using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;
using SafeScan.Infrastructure.Providers;

namespace SafeScan.Infrastructure.Providers.Placeholder;

public sealed class PlaceholderProductCatalogProvider : IProductCatalogSource
{
    private static readonly IReadOnlyList<PlaceholderProduct> Products =
    [
        new(
            Gtin: "1735000111001",
            Name: "The Original Oat Milk",
            Brand: "Oatly",
            Category: "Beverage",
            Subtitle: "Clean label oat drink",
            PackageSize: "1 l",
            ArticleNumber: "OAT-1001",
            ArticleType: "BaseArticle",
            IngredientsText: "Water, oats 10%, rapeseed oil, calcium carbonate, vitamins, salt.",
            ContainsAllergens: ["gluten"],
            MayContainAllergens: [],
            IngredientHighlights:
            [
                new IngredientHighlightDto("oats 10%", AllergenMatchStatus.Contains, "gluten")
            ],
            NutritionSummary: new NutritionSummaryDto(46, 4.0m),
            ImageUrl: null,
            PreviewBadge: "Clean Label",
            PreviewNote: "Minimal ingredients and no major warnings in placeholder data.",
            UpdatedAt: new DateTimeOffset(2026, 3, 21, 10, 0, 0, TimeSpan.Zero),
            SearchTerms: ["oat milk", "oatly", "oat", "drink", "1735000111001", "OAT-1001"]),
        new(
            Gtin: "1735000111002",
            Name: "Barista Blend Oat Milk",
            Brand: "Califia Farms",
            Category: "Beverage",
            Subtitle: "Barista-style oat drink",
            PackageSize: "1 l",
            ArticleNumber: "CAL-2002",
            ArticleType: "BaseArticle",
            IngredientsText: "Water, oats, sunflower oil, acidity regulator, natural flavors.",
            ContainsAllergens: [],
            MayContainAllergens: ["nuts"],
            IngredientHighlights:
            [
                new IngredientHighlightDto("May contain nuts", AllergenMatchStatus.MayContain, "nuts")
            ],
            NutritionSummary: new NutritionSummaryDto(59, 5.2m),
            ImageUrl: null,
            PreviewBadge: "Added Sugars",
            PreviewNote: "Placeholder data includes a caution preview for nut traces.",
            UpdatedAt: new DateTimeOffset(2026, 3, 21, 10, 5, 0, TimeSpan.Zero),
            SearchTerms: ["oat milk", "califia", "barista", "1735000111002", "CAL-2002"]),
        new(
            Gtin: "1735000111003",
            Name: "Organic Oat Milk",
            Brand: "Minor Figures",
            Category: "Beverage",
            Subtitle: "Certified organic oat drink",
            PackageSize: "1 l",
            ArticleNumber: "MIN-3003",
            ArticleType: "BaseArticle",
            IngredientsText: "Water, organic oats, sea salt.",
            ContainsAllergens: ["gluten"],
            MayContainAllergens: [],
            IngredientHighlights:
            [
                new IngredientHighlightDto("organic oats", AllergenMatchStatus.Contains, "gluten")
            ],
            NutritionSummary: new NutritionSummaryDto(44, 3.8m),
            ImageUrl: null,
            PreviewBadge: "Certified Organic",
            PreviewNote: "Organic placeholder product for search card coverage.",
            UpdatedAt: new DateTimeOffset(2026, 3, 21, 10, 10, 0, TimeSpan.Zero),
            SearchTerms: ["oat milk", "minor figures", "organic", "1735000111003", "MIN-3003"]),
        new(
            Gtin: "1735000111004",
            Name: "Milk Chocolate Bar",
            Brand: "Marabou",
            Category: "Chocolate",
            Subtitle: "Classic milk chocolate",
            PackageSize: "200 g",
            ArticleNumber: "MAR-4004",
            ArticleType: "BaseArticle",
            IngredientsText: "Sugar, cocoa butter, whey powder (milk), cocoa mass, soy lecithin, flavoring. May contain nuts.",
            ContainsAllergens: ["milk_protein", "soy"],
            MayContainAllergens: ["nuts"],
            IngredientHighlights:
            [
                new IngredientHighlightDto("whey powder (milk)", AllergenMatchStatus.Contains, "milk_protein"),
                new IngredientHighlightDto("soy lecithin", AllergenMatchStatus.Contains, "soy"),
                new IngredientHighlightDto("May contain nuts", AllergenMatchStatus.MayContain, "nuts")
            ],
            NutritionSummary: new NutritionSummaryDto(550, 58m),
            ImageUrl: null,
            PreviewBadge: "Contains allergens",
            PreviewNote: "Useful placeholder warning product for result-state testing.",
            UpdatedAt: new DateTimeOffset(2026, 3, 21, 10, 15, 0, TimeSpan.Zero),
            SearchTerms: ["chocolate", "milk chocolate", "marabou", "1735000111004", "MAR-4004"])
    ];

    public Task<IReadOnlyList<AllergenOptionDto>> GetAllergensAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(AllergenCatalog.DefaultOptions);

    public Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default)
    {
        var product = Products.FirstOrDefault(item => item.Gtin.Equals(gtin.Trim(), StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(product?.ToRecord());
    }

    public Task<IReadOnlyList<SearchResultDto>> SearchProductsAsync(
        string query,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken = default)
    {
        var normalizedQuery = query.Trim();

        var results = Products
            .Where(product => product.Matches(normalizedQuery))
            .OrderBy(product => product.Name.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(product => product.Name)
            .Select(product => product.ToSearchResult(selectedAllergens))
            .ToArray();

        return Task.FromResult<IReadOnlyList<SearchResultDto>>(results);
    }

    private sealed record PlaceholderProduct(
        string Gtin,
        string Name,
        string Brand,
        string Category,
        string Subtitle,
        string PackageSize,
        string ArticleNumber,
        string ArticleType,
        string IngredientsText,
        IReadOnlyList<string> ContainsAllergens,
        IReadOnlyList<string> MayContainAllergens,
        IReadOnlyList<IngredientHighlightDto> IngredientHighlights,
        NutritionSummaryDto NutritionSummary,
        string? ImageUrl,
        string PreviewBadge,
        string PreviewNote,
        DateTimeOffset UpdatedAt,
        IReadOnlyList<string> SearchTerms)
    {
        public bool Matches(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return false;
            }

            return SearchTerms.Any(term => term.Contains(query, StringComparison.OrdinalIgnoreCase));
        }

        public ProductRecord ToRecord() => new(
            Gtin,
            Name,
            Brand,
            Category,
            Subtitle,
            IngredientsText,
            ContainsAllergens,
            MayContainAllergens,
            IngredientHighlights,
            NutritionSummary,
            ImageUrl,
            "placeholder",
            PreviewBadge,
            PreviewNote);

        public SearchResultDto ToSearchResult(IReadOnlyCollection<string> selectedAllergens)
        {
            var previewStatus = ResolvePreviewStatus(selectedAllergens);

            return new SearchResultDto(
                Gtin,
                Name,
                Subtitle,
                Brand,
                Category,
                PackageSize,
                ArticleNumber,
                ArticleType,
                previewStatus,
                PreviewBadge,
                PreviewNote,
                UpdatedAt,
                "placeholder-search");
        }

        private AnalysisOverallStatus ResolvePreviewStatus(IReadOnlyCollection<string> selectedAllergens)
        {
            if (selectedAllergens.Count == 0)
            {
                return ContainsAllergens.Count > 0
                    ? AnalysisOverallStatus.Contains
                    : MayContainAllergens.Count > 0
                        ? AnalysisOverallStatus.MayContain
                        : AnalysisOverallStatus.Safe;
            }

            if (selectedAllergens.Any(allergen => ContainsAllergens.Contains(allergen, StringComparer.OrdinalIgnoreCase)))
            {
                return AnalysisOverallStatus.Contains;
            }

            if (selectedAllergens.Any(allergen => MayContainAllergens.Contains(allergen, StringComparer.OrdinalIgnoreCase)))
            {
                return AnalysisOverallStatus.MayContain;
            }

            return AnalysisOverallStatus.Safe;
        }
    }
}
