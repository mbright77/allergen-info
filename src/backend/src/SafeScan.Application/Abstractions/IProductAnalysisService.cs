using SafeScan.Application.Contracts;

namespace SafeScan.Application.Abstractions;

public interface IProductAnalysisService
{
    AnalysisResultDto Analyze(ProductRecord product, IReadOnlyCollection<string> selectedAllergens);
}
