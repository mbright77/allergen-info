using System.Globalization;
using System.Text;
using System.Text.Json;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;
using SafeScan.Infrastructure.Configuration;

namespace SafeScan.Infrastructure.Providers.Dabas;

public sealed class DabasProductCatalogSource : IProductCatalogSource
{
    private static readonly string[] SearchCollectionPropertyNames =
    [
        "ArticleDateModel",
        "Articles",
        "Results",
        "Data",
        "Items"
    ];

    private static readonly string[] DetailPropertyNames =
    [
        "Article",
        "Artikel",
        "Data",
        "Item"
    ];

    private static readonly IReadOnlyDictionary<string, string> AllergenCodeMap =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["milk"] = "milk_protein",
            ["milk protein"] = "milk_protein",
            ["dairy"] = "milk_protein",
            ["mjolk"] = "milk_protein",
            ["mjolkprotein"] = "milk_protein",
            ["lactose"] = "lactose",
            ["laktos"] = "lactose",
            ["egg"] = "egg",
            ["agg"] = "egg",
            ["gluten"] = "gluten",
            ["wheat"] = "gluten",
            ["vete"] = "gluten",
            ["nuts"] = "nuts",
            ["nut"] = "nuts",
            ["notter"] = "nuts",
            ["not"] = "nuts",
            ["soy"] = "soy",
            ["soya"] = "soy",
            ["soja"] = "soy",
            ["peanut"] = "peanuts",
            ["peanuts"] = "peanuts",
            ["jordnot"] = "peanuts",
            ["jordnotter"] = "peanuts",
            ["fish"] = "fish",
            ["fisk"] = "fish",
            ["shellfish"] = "shellfish",
            ["skaldjur"] = "shellfish"
        };

    private readonly HttpClient _httpClient;
    private readonly DabasOptions _options;

    public DabasProductCatalogSource(HttpClient httpClient, ProductCatalogOptions options)
    {
        _httpClient = httpClient;
        _options = options.Dabas;
    }

    public Task<IReadOnlyList<AllergenOptionDto>> GetAllergensAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(AllergenCatalog.DefaultOptions);

    public async Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(gtin))
        {
            return null;
        }

        using var response = await _httpClient.GetAsync(
            BuildRequestUri($"DABASService/V2/article/gtin/{Uri.EscapeDataString(gtin.Trim())}/json"),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        var record = ResolveSingleRecord(document.RootElement, DetailPropertyNames);
        return record.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
            ? null
            : MapProductRecord(record);
    }

    public async Task<IReadOnlyList<SearchResultDto>> SearchProductsAsync(
        string query,
        IReadOnlyCollection<string> selectedAllergens,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return [];
        }

        var normalizedQuery = query.Trim();

        var baseResults = await ExecuteSearchAsync(
            $"DABASService/V2/articles/basesearchparameter/{Uri.EscapeDataString(normalizedQuery)}/json",
            cancellationToken);

        if (baseResults.Count > 0)
        {
            return baseResults;
        }

        return await ExecuteSearchAsync(
            $"DABASService/V2/articles/searchparameter/{Uri.EscapeDataString(normalizedQuery)}/json",
            cancellationToken);
    }

    private async Task<IReadOnlyList<SearchResultDto>> ExecuteSearchAsync(string requestUri, CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(BuildRequestUri(requestUri), cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return [];
        }

        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);

        return EnumerateRecords(document.RootElement, SearchCollectionPropertyNames)
            .Select(MapSearchResult)
            .Where(static item => !string.IsNullOrWhiteSpace(item.Gtin) && !string.IsNullOrWhiteSpace(item.Name))
            .OrderByDescending(item => IsExactMatch(item.Gtin, query: ExtractQueryFromRequestUri(requestUri)))
            .ThenByDescending(item => IsExactMatch(item.ArticleNumber, query: ExtractQueryFromRequestUri(requestUri)))
            .ThenByDescending(item => IsExactMatch(item.Name, query: ExtractQueryFromRequestUri(requestUri)))
            .ThenBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool IsExactMatch(string? value, string query)
    {
        return !string.IsNullOrWhiteSpace(value)
            && value.Trim().Equals(query, StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractQueryFromRequestUri(string requestUri)
    {
        var normalized = requestUri.TrimEnd('/');
        var marker = "/json";
        var markerIndex = normalized.LastIndexOf(marker, StringComparison.OrdinalIgnoreCase);
        var pathPortion = markerIndex >= 0 ? normalized[..markerIndex] : normalized;
        var lastSlashIndex = pathPortion.LastIndexOf('/');

        return lastSlashIndex >= 0
            ? Uri.UnescapeDataString(pathPortion[(lastSlashIndex + 1)..]).Trim()
            : string.Empty;
    }

    private static ProductRecord MapProductRecord(JsonElement record)
    {
        var gtin = GetString(record, "GTIN") ?? string.Empty;
        var name = GetString(record, "Produktnamn", "Artikelbenamning") ?? gtin;
        var ingredientsText = GetString(record, "Ingrediensforteckning", "IngrediensforteckningText", "Ingredients", "IngredientsText")
            ?? "Ingredients unavailable from DABAS.";

        var allergenContainer = ResolveSingleRecord(record, "AllergenInformation", "Allergener", "AllergenStatements");
        var containsAllergens = ParseAllergenCodes(allergenContainer, "Contains", "Innehaller", "Inneh\u00e5ller");
        var mayContainAllergens = ParseAllergenCodes(allergenContainer, "MayContain", "KanInnehalla", "KanInneh\u00e5lla");

        return new ProductRecord(
            gtin,
            name,
            GetString(record, "Varumarke", "Brand"),
            GetString(record, "Artikelkategori", "Category"),
            GetString(record, "Hyllkantstext", "Subtitle"),
            ingredientsText,
            containsAllergens,
            mayContainAllergens,
            BuildIngredientHighlights(containsAllergens, mayContainAllergens),
            TryBuildNutritionSummary(record),
            GetString(record, "BildURL", "ImageUrl"),
            "dabas",
            null,
            null);
    }

    private static SearchResultDto MapSearchResult(JsonElement record)
    {
        var name = GetString(record, "Produktnamn", "Artikelbenamning") ?? GetString(record, "GTIN") ?? "Unknown product";

        return new SearchResultDto(
            GetString(record, "GTIN") ?? string.Empty,
            name,
            GetString(record, "Hyllkantstext", "Subtitle"),
            GetString(record, "Varumarke", "Brand"),
            GetString(record, "Artikelkategori", "Category"),
            GetString(record, "Forpackningsstorlek", "PackageSize"),
            GetString(record, "TillverkarensArtikelnummer", "ArticleNumber"),
            GetString(record, "Artikeltyp", "ArticleType"),
            null,
            null,
            null,
            ParseDate(record, "SenastAndradDatum", "UpdatedAt") ?? DateTimeOffset.UnixEpoch,
            "dabas-search");
    }

    private static IReadOnlyList<IngredientHighlightDto> BuildIngredientHighlights(
        IReadOnlyList<string> containsAllergens,
        IReadOnlyList<string> mayContainAllergens)
    {
        var highlights = new List<IngredientHighlightDto>(containsAllergens.Count + mayContainAllergens.Count);

        highlights.AddRange(containsAllergens.Select(static allergen => new IngredientHighlightDto(allergen, SafeScan.Domain.Products.AllergenMatchStatus.Contains, allergen)));
        highlights.AddRange(mayContainAllergens.Select(static allergen => new IngredientHighlightDto(allergen, SafeScan.Domain.Products.AllergenMatchStatus.MayContain, allergen)));

        return highlights;
    }

    private string BuildRequestUri(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) || string.IsNullOrWhiteSpace(_options.ApiKeyQueryParameterName))
        {
            return relativePath;
        }

        var separator = relativePath.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return $"{relativePath}{separator}{Uri.EscapeDataString(_options.ApiKeyQueryParameterName)}={Uri.EscapeDataString(_options.ApiKey)}";
    }

    private static NutritionSummaryDto? TryBuildNutritionSummary(JsonElement record)
    {
        var calories = ParseInt(record, "EnergiKcal", "EnergyKcal", "EnergyKcalPer100g");
        var sugar = ParseDecimal(record, "SockerGram", "SugarGrams", "SugarGramsPer100g");

        return calories is null && sugar is null
            ? null
            : new NutritionSummaryDto(calories, sugar);
    }

    private static IReadOnlyList<string> ParseAllergenCodes(JsonElement container, params string[] propertyNames)
    {
        if (container.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return [];
        }

        var codes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(container, propertyName, out var value))
            {
                continue;
            }

            foreach (var code in ExtractAllergenCodes(value))
            {
                codes.Add(code);
            }
        }

        return codes.ToArray();
    }

    private static IEnumerable<string> ExtractAllergenCodes(JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                return SplitAllergenValues(value.GetString());
            case JsonValueKind.Array:
                return value.EnumerateArray().SelectMany(ExtractAllergenCodes);
            case JsonValueKind.Object:
                var objectText = GetString(value, "Code", "code", "Name", "name", "Text", "text", "Label", "label");
                return string.IsNullOrWhiteSpace(objectText) ? [] : SplitAllergenValues(objectText);
            default:
                return [];
        }
    }

    private static IEnumerable<string> SplitAllergenValues(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return [];
        }

        return rawValue
            .Split([',', ';', '/', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(NormalizeAllergenToken)
            .Where(static token => token.Length > 0)
            .Select(MapAllergenCode)
            .Where(static code => code.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static string MapAllergenCode(string token)
    {
        return AllergenCodeMap.TryGetValue(token, out var code) ? code : token;
    }

    private static string NormalizeAllergenToken(string rawToken)
    {
        var normalized = rawToken.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);

            if (category == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            builder.Append(char.IsLetterOrDigit(character) ? char.ToLowerInvariant(character) : ' ');
        }

        return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    private static IEnumerable<JsonElement> EnumerateRecords(JsonElement root, params string[] collectionPropertyNames)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            return root.EnumerateArray().ToArray();
        }

        if (root.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        foreach (var propertyName in collectionPropertyNames)
        {
            if (TryGetPropertyIgnoreCase(root, propertyName, out var propertyValue) && propertyValue.ValueKind == JsonValueKind.Array)
            {
                return propertyValue.EnumerateArray().ToArray();
            }
        }

        return HasIdentityFields(root) ? [root] : [];
    }

    private static JsonElement ResolveSingleRecord(JsonElement root, params string[] propertyNames)
    {
        if (root.ValueKind == JsonValueKind.Array)
        {
            return root.EnumerateArray().FirstOrDefault();
        }

        if (root.ValueKind != JsonValueKind.Object)
        {
            return default;
        }

        foreach (var propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(root, propertyName, out var propertyValue))
            {
                continue;
            }

            if (propertyValue.ValueKind == JsonValueKind.Array)
            {
                return propertyValue.EnumerateArray().FirstOrDefault();
            }

            if (propertyValue.ValueKind == JsonValueKind.Object)
            {
                return propertyValue;
            }
        }

        return HasIdentityFields(root) ? root : default;
    }

    private static bool HasIdentityFields(JsonElement value)
        => GetString(value, "GTIN") is not null || GetString(value, "Produktnamn", "Artikelbenamning") is not null;

    private static string? GetString(JsonElement element, params string[] propertyNames)
    {
        foreach (var propertyName in propertyNames)
        {
            if (!TryGetPropertyIgnoreCase(element, propertyName, out var propertyValue))
            {
                continue;
            }

            if (propertyValue.ValueKind == JsonValueKind.String)
            {
                return propertyValue.GetString();
            }

            if (propertyValue.ValueKind is JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False)
            {
                return propertyValue.ToString();
            }
        }

        return null;
    }

    private static DateTimeOffset? ParseDate(JsonElement element, params string[] propertyNames)
    {
        var rawValue = GetString(element, propertyNames);
        return DateTimeOffset.TryParse(rawValue, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed
            : null;
    }

    private static int? ParseInt(JsonElement element, params string[] propertyNames)
    {
        var rawValue = GetString(element, propertyNames);
        return int.TryParse(rawValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;
    }

    private static decimal? ParseDecimal(JsonElement element, params string[] propertyNames)
    {
        var rawValue = GetString(element, propertyNames);
        return decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            value = default;
            return false;
        }

        foreach (var property in element.EnumerateObject())
        {
            if (property.NameEquals(propertyName) || property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }
}
