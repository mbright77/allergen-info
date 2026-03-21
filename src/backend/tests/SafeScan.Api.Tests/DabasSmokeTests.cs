using System.Net;
using FluentAssertions;
using SafeScan.Infrastructure.Configuration;
using SafeScan.Infrastructure.Providers.Dabas;

namespace SafeScan.Api.Tests;

public sealed class DabasSmokeTests
{
    [Fact]
    public async Task RealDabasSmoke_SearchAndLookup_WorkWhenExplicitlyEnabled()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("RUN_DABAS_SMOKE_TESTS"), "true", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var baseUrl = Environment.GetEnvironmentVariable("DABAS_BASE_URL");
        var apiKey = Environment.GetEnvironmentVariable("DABAS_API_KEY");

        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("RUN_DABAS_SMOKE_TESTS=true requires DABAS_BASE_URL and DABAS_API_KEY.");
        }

        using var httpClient = new HttpClient(new HttpClientHandler())
        {
            BaseAddress = new Uri(baseUrl, UriKind.Absolute),
            Timeout = TimeSpan.FromSeconds(30)
        };

        var source = new DabasProductCatalogSource(
            httpClient,
            new ProductCatalogOptions
            {
                Provider = "Dabas",
                Dabas = new DabasOptions
                {
                    BaseUrl = baseUrl,
                    ApiKey = apiKey,
                    ApiKeyQueryParameterName = Environment.GetEnvironmentVariable("DABAS_API_KEY_QUERY_NAME") ?? "apikey",
                    ApiKeyHeaderName = Environment.GetEnvironmentVariable("DABAS_API_KEY_HEADER_NAME")
                }
            });

        var searchResults = await source.SearchProductsAsync(Environment.GetEnvironmentVariable("DABAS_SMOKE_QUERY") ?? "oat milk", []);
        searchResults.Should().NotBeNull();

        var gtin = Environment.GetEnvironmentVariable("DABAS_SMOKE_GTIN") ?? searchResults.FirstOrDefault()?.Gtin;

        if (string.IsNullOrWhiteSpace(gtin))
        {
            throw new InvalidOperationException("No GTIN available for DABAS smoke lookup. Set DABAS_SMOKE_GTIN or ensure the smoke query returns results.");
        }

        var product = await source.GetProductByGtinAsync(gtin);

        product.Should().NotBeNull();
        product!.Gtin.Should().Be(gtin);
        product.Source.Should().Be("dabas");
    }
}
