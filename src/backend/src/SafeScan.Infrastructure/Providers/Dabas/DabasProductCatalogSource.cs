using System.Globalization;
using System.Text.Json;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Allergens;
using SafeScan.Application.Contracts;
using SafeScan.Domain.Products;
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

    private static readonly string[] PreferredSearchImageTypes =
    [
        "PRODUCT_IMAGE_MEDIUM",
        "PRODUCT_IMAGE",
        "PRODUCT_IMAGE_LARGE",
        "PRODUCT_IMAGE_THUMB"
    ];

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

        var allergenFacts = ParseAllergenFacts(record);
        var containsAllergens = allergenFacts
            .Where(static fact => fact.Status == AllergenMatchStatus.Contains)
            .Select(static fact => fact.AllergenCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var mayContainAllergens = allergenFacts
            .Where(static fact => fact.Status == AllergenMatchStatus.MayContain)
            .Select(static fact => fact.AllergenCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new ProductRecord(
            gtin,
            name,
            GetString(record, "Varumarke", "Brand"),
            GetString(record, "Artikelkategori", "Category"),
            GetString(record, "Hyllkantstext", "Subtitle"),
            ingredientsText,
            allergenFacts,
            containsAllergens,
            mayContainAllergens,
            BuildIngredientHighlights(containsAllergens, mayContainAllergens),
            TryBuildNutritionSummary(record),
            SelectImageUrl(record),
            "dabas",
            null,
            null);
    }

    private static SearchResultDto MapSearchResult(JsonElement record)
    {
        var name = GetString(record, "Produktnamn", "Artikelbenamning") ?? string.Empty;

        return new SearchResultDto(
            GetString(record, "GTIN") ?? string.Empty,
            name,
            GetString(record, "Hyllkantstext", "Subtitle"),
            GetString(record, "Varumarke", "Brand"),
            GetString(record, "Artikelkategori", "Category"),
            SelectImageUrl(record),
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

        highlights.AddRange(containsAllergens.Select(allergen => new IngredientHighlightDto(AllergenCatalog.GetLabel(allergen), AllergenMatchStatus.Contains, allergen)));
        highlights.AddRange(mayContainAllergens.Select(allergen => new IngredientHighlightDto(AllergenCatalog.GetLabel(allergen), AllergenMatchStatus.MayContain, allergen)));

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

    private static string? SelectImageUrl(JsonElement record)
    {
        if (!TryGetPropertyIgnoreCase(record, "Bilder", out var imagesValue) || imagesValue.ValueKind != JsonValueKind.Array)
        {
            return GetString(record, "BildURL", "ImageUrl");
        }

        var images = imagesValue
            .EnumerateArray()
            .Where(static image => image.ValueKind == JsonValueKind.Object)
            .ToArray();

        foreach (var preferredType in PreferredSearchImageTypes)
        {
            var imageUrl = images
                .Where(image => string.Equals(GetString(image, "Informationstyp", "Type"), preferredType, StringComparison.OrdinalIgnoreCase))
                .OrderBy(image => ParseInt(image, "Sekvensnummer", "SequenceNumber") ?? int.MaxValue)
                .Select(image => GetString(image, "Lank", "Link", "Url"))
                .FirstOrDefault(static url => !string.IsNullOrWhiteSpace(url));

            if (!string.IsNullOrWhiteSpace(imageUrl))
            {
                return imageUrl;
            }
        }

        return GetString(record, "BildURL", "ImageUrl");
    }

    private static IReadOnlyList<ProductAllergenFact> ParseAllergenFacts(JsonElement record)
    {
        var allergenFacts = new List<ProductAllergenFact>();

        if (TryGetPropertyIgnoreCase(record, "Allergener", out var allergensValue) && allergensValue.ValueKind == JsonValueKind.Array)
        {
            foreach (var allergen in allergensValue.EnumerateArray())
            {
                var fact = MapAllergenFact(allergen);

                if (fact is not null)
                {
                    allergenFacts.Add(fact);
                }
            }
        }

        var allergenContainer = ResolveSingleRecord(record, "AllergenInformation", "AllergenStatements");

        if (allergenContainer.ValueKind is not JsonValueKind.Undefined and not JsonValueKind.Null)
        {
            allergenFacts.AddRange(ParseLegacyAllergenFacts(allergenContainer, "Contains", "Innehaller", "Inneh\u00e5ller", AllergenMatchStatus.Contains));
            allergenFacts.AddRange(ParseLegacyAllergenFacts(allergenContainer, "MayContain", "KanInnehalla", "KanInneh\u00e5lla", AllergenMatchStatus.MayContain));
        }

        return allergenFacts
            .DistinctBy(static fact => (fact.AllergenCode, fact.Gs1Code, fact.Status))
            .ToArray();
    }

    private static ProductAllergenFact? MapAllergenFact(JsonElement allergen)
    {
        var gs1Code = GetString(allergen, "Allergenkod", "AllergenCode")?.Trim().ToUpperInvariant();
        var canonicalCode = AllergenCatalog.MapGs1Code(gs1Code);

        if (string.IsNullOrWhiteSpace(gs1Code) || string.IsNullOrWhiteSpace(canonicalCode))
        {
            return null;
        }

        var levelCode = GetString(allergen, "Nivakod", "LevelCode")?.Trim().ToUpperInvariant();
        var levelText = GetString(allergen, "NivakodText", "Niva", "NivaText", "LevelText");
        var status = MapContainmentStatus(levelCode, levelText);

        return status is null
            ? null
            : new ProductAllergenFact(canonicalCode, gs1Code, status.Value);
    }

    private static IReadOnlyList<ProductAllergenFact> ParseLegacyAllergenFacts(
        JsonElement container,
        string propertyName,
        string swedishPropertyName,
        string swedishPropertyNameWithAccent,
        AllergenMatchStatus status)
    {
        if (!TryGetPropertyIgnoreCase(container, propertyName, out var value)
            && !TryGetPropertyIgnoreCase(container, swedishPropertyName, out value)
            && !TryGetPropertyIgnoreCase(container, swedishPropertyNameWithAccent, out value))
        {
            return [];
        }

        return ExtractLegacyCanonicalCodes(value)
            .SelectMany(allergenCode => AllergenCatalog.BuildFacts([allergenCode], status))
            .ToArray();
    }

    private static IEnumerable<string> ExtractLegacyCanonicalCodes(JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                return SplitLegacyAllergenValues(value.GetString());
            case JsonValueKind.Array:
                return value.EnumerateArray().SelectMany(ExtractLegacyCanonicalCodes);
            case JsonValueKind.Object:
                var objectText = GetString(value, "Code", "code", "Name", "name", "Text", "text", "Label", "label");
                return string.IsNullOrWhiteSpace(objectText) ? [] : SplitLegacyAllergenValues(objectText);
            default:
                return [];
        }
    }

    private static IEnumerable<string> SplitLegacyAllergenValues(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return [];
        }

        return rawValue
            .Split([',', ';', '/', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(MapLegacyAllergenCode)
            .OfType<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase);
    }

    private static string? MapLegacyAllergenCode(string rawToken)
    {
        return rawToken.Trim().ToLowerInvariant() switch
        {
            "milk" => "milk",
            "soy" => "soybeans",
            "nuts" => "tree_nuts",
            "egg" => "eggs",
            "gluten" => "cereals_containing_gluten",
            "fish" => "fish",
            "peanuts" => "peanuts",
            _ => null
        };
    }

    private static AllergenMatchStatus? MapContainmentStatus(string? levelCode, string? levelText)
    {
        if (MatchesContainmentValue(levelCode, levelText, "CONTAINS", "Contains"))
        {
            return AllergenMatchStatus.Contains;
        }

        if (MatchesContainmentValue(levelCode, levelText, "MAY_CONTAIN", "May contain"))
        {
            return AllergenMatchStatus.MayContain;
        }

        return null;
    }

    private static bool MatchesContainmentValue(string? levelCode, string? levelText, string expectedCode, string expectedText)
    {
        return string.Equals(levelCode, expectedCode, StringComparison.OrdinalIgnoreCase)
            || string.Equals(levelText, expectedText, StringComparison.OrdinalIgnoreCase);
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
