using SafeScan.Application.Contracts;

namespace SafeScan.Infrastructure.Providers;

internal static class AllergenCatalog
{
    public static readonly IReadOnlyList<AllergenOptionDto> DefaultOptions =
    [
        new("milk_protein", "Milk Protein"),
        new("lactose", "Lactose Intolerance"),
        new("egg", "Egg"),
        new("gluten", "Gluten"),
        new("nuts", "Nuts"),
        new("soy", "Soy"),
        new("peanuts", "Peanuts"),
        new("fish", "Fish"),
        new("shellfish", "Shellfish")
    ];
}
