namespace SafeScan.Application.Contracts;

public sealed record AllergenStatementsDto(IReadOnlyList<string> Contains, IReadOnlyList<string> MayContain);
