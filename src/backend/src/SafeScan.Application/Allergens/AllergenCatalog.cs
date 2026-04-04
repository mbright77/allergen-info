using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;

namespace SafeScan.Application.Allergens;

public static class AllergenCatalog
{
    public static readonly IReadOnlyList<AllergenDefinition> Definitions =
    [
        new("cereals_containing_gluten", "Cereals containing gluten", ["AW", "UW", "UR", "UB", "UO"]),
        new("crustaceans", "Crustaceans", ["AC"]),
        new("eggs", "Eggs", ["AE"]),
        new("fish", "Fish", ["AF"]),
        new("peanuts", "Peanuts", ["AP"]),
        new("soybeans", "Soybeans", ["AY"]),
        new("milk", "Milk", ["AM"]),
        new("tree_nuts", "Tree nuts", ["AN", "UN", "UC", "UH", "UP", "UI", "UM", "UF"]),
        new("celery", "Celery", ["BC"]),
        new("mustard", "Mustard", ["BM"]),
        new("sesame_seeds", "Sesame seeds", ["AS"]),
        new("sulphur_dioxide_sulphites", "Sulphur dioxide / sulphites", ["AU"]),
        new("lupin", "Lupin", ["AL"]),
        new("molluscs", "Molluscs", ["AMO"])
    ];

    public static readonly IReadOnlyList<AllergenOptionDto> DefaultOptions = Definitions
        .Select(static definition => new AllergenOptionDto(definition.Code, definition.Label))
        .ToArray();

    private static readonly IReadOnlyDictionary<string, AllergenDefinition> DefinitionsByCode = Definitions
        .ToDictionary(static definition => definition.Code, StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyDictionary<string, string> CanonicalCodesByGs1Code = Definitions
        .SelectMany(static definition => definition.Gs1Codes.Select(gs1Code => new KeyValuePair<string, string>(gs1Code, definition.Code)))
        .ToDictionary(static pair => pair.Key, static pair => pair.Value, StringComparer.OrdinalIgnoreCase);

    public static bool TryGetDefinition(string allergenCode, out AllergenDefinition? definition)
    {
        if (string.IsNullOrWhiteSpace(allergenCode))
        {
            definition = null;
            return false;
        }

        return DefinitionsByCode.TryGetValue(allergenCode.Trim(), out definition);
    }

    public static IReadOnlyList<string> GetGs1Codes(string allergenCode)
    {
        return TryGetDefinition(allergenCode, out var definition)
            ? definition!.Gs1Codes
            : [];
    }

    public static string GetLabel(string allergenCode)
    {
        return TryGetDefinition(allergenCode, out var definition)
            ? definition!.Label
            : allergenCode;
    }

    public static string? MapGs1Code(string? gs1Code)
    {
        if (string.IsNullOrWhiteSpace(gs1Code))
        {
            return null;
        }

        var normalizedCode = gs1Code.Trim().ToUpperInvariant();
        return CanonicalCodesByGs1Code.TryGetValue(normalizedCode, out var canonicalCode)
            ? canonicalCode
            : null;
    }

    public static string? GetPrimaryGs1Code(string allergenCode)
    {
        return TryGetDefinition(allergenCode, out var definition)
            ? definition!.Gs1Codes.FirstOrDefault()
            : null;
    }

    public static IReadOnlyList<ProductAllergenFact> BuildFacts(
        IEnumerable<string> allergenCodes,
        AllergenMatchStatus status)
    {
        return allergenCodes
            .Where(static allergenCode => !string.IsNullOrWhiteSpace(allergenCode))
            .Select(static allergenCode => allergenCode.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(allergenCode =>
            {
                var primaryGs1Code = GetPrimaryGs1Code(allergenCode);
                return string.IsNullOrWhiteSpace(primaryGs1Code)
                    ? null
                    : new ProductAllergenFact(allergenCode, primaryGs1Code, status);
            })
            .Where(static fact => fact is not null)
            .Cast<ProductAllergenFact>()
            .ToArray();
    }
}
