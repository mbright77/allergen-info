namespace SafeScan.Application.Contracts;

public sealed record AnalysisResponse(ProductDto Product, AnalysisResultDto Analysis);
