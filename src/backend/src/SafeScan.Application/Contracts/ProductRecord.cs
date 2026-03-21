namespace SafeScan.Application.Contracts;

public sealed record ProductRecord(
    string Gtin,
    string Name,
    string? Brand,
    string? Category,
    string? Subtitle,
    string IngredientsText,
    IReadOnlyList<string> ContainsAllergens,
    IReadOnlyList<string> MayContainAllergens,
    IReadOnlyList<IngredientHighlightDto> IngredientHighlights,
    NutritionSummaryDto? NutritionSummary,
    string? ImageUrl,
    string Source,
    string? PreviewBadge,
    string? PreviewNote)
{
    public ProductDto ToDto() => new(
        Gtin,
        Name,
        Brand,
        Category,
        Subtitle,
        IngredientsText,
        new AllergenStatementsDto(ContainsAllergens, MayContainAllergens),
        NutritionSummary,
        ImageUrl,
        Source);
}
