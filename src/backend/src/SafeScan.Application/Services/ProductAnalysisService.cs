using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;

namespace SafeScan.Application.Services;

public sealed class ProductAnalysisService : IProductAnalysisService
{
    public AnalysisResultDto Analyze(ProductRecord product, IReadOnlyCollection<string> selectedAllergens)
    {
        var normalizedSelections = selectedAllergens
            .Where(static allergen => !string.IsNullOrWhiteSpace(allergen))
            .Select(static allergen => allergen.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (normalizedSelections.Length == 0)
        {
            return new AnalysisResultDto(
                AnalysisOverallStatus.Unknown,
                [],
                [],
                [],
                [],
                ["No allergens were selected for analysis."]);
        }

        var contains = new HashSet<string>(product.ContainsAllergens, StringComparer.OrdinalIgnoreCase);
        var mayContain = new HashSet<string>(product.MayContainAllergens, StringComparer.OrdinalIgnoreCase);

        var checkedAllergens = new List<CheckedAllergenDto>(normalizedSelections.Length);
        var matchedAllergens = new List<string>();
        var traceAllergens = new List<string>();

        foreach (var allergen in normalizedSelections)
        {
            if (contains.Contains(allergen))
            {
                matchedAllergens.Add(allergen);
                checkedAllergens.Add(new CheckedAllergenDto(allergen, AllergenMatchStatus.Contains));
                continue;
            }

            if (mayContain.Contains(allergen))
            {
                traceAllergens.Add(allergen);
                checkedAllergens.Add(new CheckedAllergenDto(allergen, AllergenMatchStatus.MayContain));
                continue;
            }

            checkedAllergens.Add(new CheckedAllergenDto(allergen, AllergenMatchStatus.NotFound));
        }

        var overallStatus = matchedAllergens.Count > 0
            ? AnalysisOverallStatus.Contains
            : traceAllergens.Count > 0
                ? AnalysisOverallStatus.MayContain
                : AnalysisOverallStatus.Safe;

        var explanations = BuildExplanations(overallStatus, matchedAllergens, traceAllergens);

        var ingredientHighlights = product.IngredientHighlights
            .Where(highlight => normalizedSelections.Contains(highlight.AllergenCode, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        return new AnalysisResultDto(
            overallStatus,
            matchedAllergens,
            traceAllergens,
            checkedAllergens,
            ingredientHighlights,
            explanations);
    }

    private static IReadOnlyList<string> BuildExplanations(
        AnalysisOverallStatus overallStatus,
        IReadOnlyCollection<string> matchedAllergens,
        IReadOnlyCollection<string> traceAllergens)
    {
        return overallStatus switch
        {
            AnalysisOverallStatus.Contains =>
            [
                $"The product contains selected allergens: {string.Join(", ", matchedAllergens)}.",
                traceAllergens.Count > 0
                    ? $"It also carries trace warnings for: {string.Join(", ", traceAllergens)}."
                    : "The warning is based on confirmed allergen matches in the product data."
            ],
            AnalysisOverallStatus.MayContain =>
            [$"The product may contain traces of: {string.Join(", ", traceAllergens)}."],
            AnalysisOverallStatus.Safe => ["No selected allergens were detected in the available product data."],
            _ => ["The product could not be analyzed with the available data."]
        };
    }
}
