namespace SafeScan.Application.Contracts;

public sealed record AnalysisRequest(string Gtin, IReadOnlyList<string> SelectedAllergens);
