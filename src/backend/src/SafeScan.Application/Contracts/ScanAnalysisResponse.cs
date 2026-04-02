namespace SafeScan.Application.Contracts;

public sealed record ScanAnalysisResponse(
    ScanResolutionDto Resolution,
    ProductDto? Product,
    AnalysisResultDto? Analysis);
