namespace SafeScan.Infrastructure.Configuration;

public sealed class ProductCatalogOptions
{
    public const string SectionName = "ProductCatalog";

    public string Provider { get; init; } = "Placeholder";

    public DabasOptions Dabas { get; init; } = new();
}

public sealed class DabasOptions
{
    public string? BaseUrl { get; init; }

    public string? ApiKey { get; init; }

    public string? ApiKeyHeaderName { get; init; }

    public string? ApiKeyQueryParameterName { get; init; }
}
