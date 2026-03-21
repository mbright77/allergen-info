namespace SafeScan.Application.Contracts;

public sealed record ProductDto(
    string Gtin,
    string Name,
    string? Brand,
    string? Category,
    string? Subtitle,
    string IngredientsText,
    AllergenStatementsDto AllergenStatements,
    NutritionSummaryDto? NutritionSummary,
    string? ImageUrl,
    string Source);
