namespace SafeScan.Application.Contracts;

public sealed record ProductSearchResponse(string Query, IReadOnlyList<SearchResultDto> Results);
