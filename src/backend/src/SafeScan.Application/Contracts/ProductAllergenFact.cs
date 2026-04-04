using SafeScan.Domain.Products;

namespace SafeScan.Application.Contracts;

public sealed record ProductAllergenFact(
    string AllergenCode,
    string Gs1Code,
    AllergenMatchStatus Status);
