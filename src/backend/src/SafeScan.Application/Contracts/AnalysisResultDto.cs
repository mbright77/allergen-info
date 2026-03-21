using SafeScan.Domain.Products;

namespace SafeScan.Application.Contracts;

public sealed record AnalysisResultDto(
    AnalysisOverallStatus OverallStatus,
    IReadOnlyList<string> MatchedAllergens,
    IReadOnlyList<string> TraceAllergens,
    IReadOnlyList<CheckedAllergenDto> CheckedAllergens,
    IReadOnlyList<IngredientHighlightDto> IngredientHighlights,
    IReadOnlyList<string> Explanations);
