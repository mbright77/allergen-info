using SafeScan.Domain.Products;

namespace SafeScan.Application.Contracts;

public sealed record CheckedAllergenDto(string Code, AllergenMatchStatus Status);
