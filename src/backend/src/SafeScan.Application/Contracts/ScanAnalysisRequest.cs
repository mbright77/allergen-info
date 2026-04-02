namespace SafeScan.Application.Contracts;

public sealed record ScanAnalysisRequest(string Code, IReadOnlyList<string> SelectedAllergens);
