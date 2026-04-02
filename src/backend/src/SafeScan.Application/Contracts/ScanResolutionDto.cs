namespace SafeScan.Application.Contracts;

public sealed record ScanResolutionDto(
    ScanResolutionMode Mode,
    string ScannedCode,
    string? ResolvedGtin,
    string? Message);
