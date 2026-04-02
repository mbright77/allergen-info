using SafeScan.Application.Contracts;

namespace SafeScan.Application.Abstractions;

public interface IScanProductAnalysisService
{
    Task<ScanAnalysisResponse> AnalyzeScanAsync(ScanAnalysisRequest request, CancellationToken cancellationToken = default);
}
