namespace SafeScan.Application.Allergens;

public sealed record AllergenDefinition(
    string Code,
    string Label,
    IReadOnlyList<string> Gs1Codes);
