using SafeScan.Domain.Products;

namespace SafeScan.Application.Contracts;

public sealed record IngredientHighlightDto(string Text, AllergenMatchStatus Severity, string AllergenCode);
