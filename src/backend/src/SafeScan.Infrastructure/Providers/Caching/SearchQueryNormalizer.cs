namespace SafeScan.Infrastructure.Providers.Caching;

public sealed class SearchQueryNormalizer
{
    public string NormalizeQuery(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return string.Empty;
        }

        return string.Join(
            ' ',
            query
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .ToLowerInvariant();
    }

    public string NormalizeGtin(string gtin)
    {
        return string.IsNullOrWhiteSpace(gtin) ? string.Empty : gtin.Trim();
    }

    public string NormalizeSelectedAllergens(IReadOnlyCollection<string> selectedAllergens)
    {
        return string.Join(
            '|',
            selectedAllergens
                .Where(static allergen => !string.IsNullOrWhiteSpace(allergen))
                .Select(static allergen => allergen.Trim().ToLowerInvariant())
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static allergen => allergen, StringComparer.Ordinal));
    }
}
