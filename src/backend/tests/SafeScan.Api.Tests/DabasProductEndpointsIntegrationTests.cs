using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using SafeScan.Application.Contracts;

namespace SafeScan.Api.Tests;

public sealed class DabasProductEndpointsIntegrationTests
{
    [Fact]
    public async Task SearchEndpoint_UsesDabasProviderAndReturnsNormalizedResults()
    {
        using var factory = new DabasApiWebApplicationFactory(request =>
        {
            return request.RequestUri!.ToString().Contains("searchparameter", StringComparison.Ordinal)
                ? DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111001",
                          "Produktnamn": "The Original Oat Milk",
                          "Varumarke": "Oatly",
                          "Artikelkategori": "Beverage",
                          "Bilder": [
                            {
                              "Informationstyp": "PRODUCT_IMAGE_MEDIUM",
                              "Lank": "https://cdn.example.test/oat-medium.jpg",
                              "Sekvensnummer": 1
                            }
                          ],
                          "SenastAndradDatum": "2026-03-21T10:00:00Z"
                        }
                      ]
                    }
                    """)
                : DabasApiWebApplicationFactory.Json("{\"ArticleDateModel\":[]}");
        });

        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/products/search?q=oat%20milk");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ProductSearchResponse>();

        payload.Should().NotBeNull();
        payload!.Results.Should().ContainSingle();
        payload.Results[0].Gtin.Should().Be("1735000111001");
        payload.Results[0].ImageUrl.Should().Be("https://cdn.example.test/oat-medium.jpg");
        payload.Results[0].Source.Should().Be("dabas-search");
        factory.Requests.Should().ContainSingle(request => request.Contains("searchparameter/oat milk/json"));
    }

    [Fact]
    public async Task ProductLookupEndpoint_UsesDabasProviderAndReturnsNormalizedProduct()
    {
        using var factory = new DabasApiWebApplicationFactory(_ =>
            DabasApiWebApplicationFactory.Json(
                """
                {
                  "Article": {
                    "GTIN": "1735000111004",
                    "Produktnamn": "Milk Chocolate Bar",
                    "Varumarke": "Marabou",
                    "Artikelkategori": "Chocolate",
                    "Ingrediensforteckning": "Sugar, whey powder (milk), soy lecithin.",
                    "Allergener": [
                      {
                        "Allergen": "Milk",
                        "Allergenkod": "AM",
                        "Niva": "Contains",
                        "Nivakod": "CONTAINS",
                        "NivakodText": "Contains"
                      },
                      {
                        "Allergen": "Soybeans",
                        "Allergenkod": "AY",
                        "Niva": "Contains",
                        "Nivakod": "CONTAINS",
                        "NivakodText": "Contains"
                      },
                      {
                        "Allergen": "Tree nuts",
                        "Allergenkod": "AN",
                        "Niva": "May contain",
                        "Nivakod": "MAY_CONTAIN",
                        "NivakodText": "May contain"
                      }
                    ]
                  }
                }
                """));

        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/products/gtin/1735000111004");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ProductLookupResponse>();

        payload.Should().NotBeNull();
        payload!.Product.Name.Should().Be("Milk Chocolate Bar");
        payload.Product.Source.Should().Be("dabas");
        payload.Product.AllergenStatements.Contains.Should().BeEquivalentTo(["milk", "soybeans"]);
    }

    [Fact]
    public async Task ScanAnalysisEndpoint_ReturnsBasicFallbackWhenDetailLookupMisses()
    {
        using var factory = new DabasApiWebApplicationFactory(request =>
        {
            if (request.RequestUri!.ToString().Contains("searchparameter/1735000111001/json", StringComparison.Ordinal))
            {
                return DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111004",
                          "Produktnamn": "The Original Oat Milk",
                          "Varumarke": "Oatly",
                          "Artikelkategori": "Beverage"
                        }
                      ]
                    }
                    """);
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/analysis/scan", new
        {
            code = "1735000111001",
            selectedAllergens = new[] { "milk" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ScanAnalysisPayload>();

        payload.Should().NotBeNull();
        payload!.Resolution.Mode.Should().Be("Basic");
        payload.Resolution.ResolvedGtin.Should().Be("1735000111004");
        payload.Analysis!.OverallStatus.Should().Be("Unknown");
    }

    [Fact]
    public async Task ScanAnalysisEndpoint_UsesResolvedSearchGtinForDetailLookupWhenSearchReturnsSameGtin()
    {
        var gtinLookupCount = 0;

        using var factory = new DabasApiWebApplicationFactory(request =>
        {
            if (request.RequestUri!.ToString().Contains("article/gtin/1735000111001/json", StringComparison.Ordinal))
            {
                gtinLookupCount++;

                return gtinLookupCount == 1
                    ? new HttpResponseMessage(HttpStatusCode.NotFound)
                    : DabasApiWebApplicationFactory.Json(
                        """
                        {
                          "Article": {
                            "GTIN": "1735000111001",
                            "Produktnamn": "The Original Oat Milk",
                            "Varumarke": "Oatly",
                            "Artikelkategori": "Beverage",
                            "Ingrediensforteckning": "Water, oats 10%, rapeseed oil.",
                            "Allergener": [
                              {
                                "Allergen": "Milk",
                                "Allergenkod": "AM",
                                "Niva": "Contains",
                                "Nivakod": "CONTAINS",
                                "NivakodText": "Contains"
                              }
                            ]
                          }
                        }
                        """);
            }

            if (request.RequestUri!.ToString().Contains("searchparameter/1735000111001/json", StringComparison.Ordinal))
            {
                return DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111001",
                          "Produktnamn": "The Original Oat Milk",
                          "Varumarke": "Oatly",
                          "Artikelkategori": "Beverage"
                        }
                      ]
                    }
                    """);
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/analysis/scan", new
        {
            code = "1735000111001",
            selectedAllergens = new[] { "milk" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ScanAnalysisPayload>();

        payload.Should().NotBeNull();
        payload!.Resolution.Mode.Should().Be("Full");
        payload.Resolution.ResolvedGtin.Should().Be("1735000111001");
        payload.Analysis!.OverallStatus.Should().Be("Contains");
        factory.Requests.Should().Contain(request => request.Contains("searchparameter/1735000111001/json", StringComparison.Ordinal));
        factory.Requests.Count(request => request.Contains("article/gtin/1735000111001/json", StringComparison.Ordinal)).Should().Be(2);
    }

    [Fact]
    public async Task ScanAnalysisEndpoint_ReturnsUnknownWhenBarcodeLookupMissesButSearchFindsProduct()
    {
        using var factory = new DabasApiWebApplicationFactory(request =>
        {
            if (request.RequestUri!.ToString().Contains("searchparameter/1735000111001/json", StringComparison.Ordinal))
            {
                return DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111004",
                          "Produktnamn": "Cookie Bites",
                          "Varumarke": "Test Brand",
                          "Artikelkategori": "Cookies"
                        }
                      ]
                    }
                    """);
            }

            if (request.RequestUri!.ToString().Contains("article/gtin/1735000111004/json", StringComparison.Ordinal))
            {
                return DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "Article": {
                        "GTIN": "1735000111004",
                        "Produktnamn": "Cookie Bites",
                        "Varumarke": "Test Brand",
                        "Artikelkategori": "Cookies",
                        "Ingrediensforteckning": "Wheat flour, sugar, butter.",
                        "Allergener": []
                      }
                    }
                    """);
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/analysis/scan", new
        {
            code = "1735000111001",
            selectedAllergens = new[] { "cereals_containing_gluten" }
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ScanAnalysisPayload>();

        payload.Should().NotBeNull();
        payload!.Resolution.Mode.Should().Be("Unverified");
        payload.Resolution.ResolvedGtin.Should().Be("1735000111004");
        payload.Product.Should().NotBeNull();
        payload.Product!.Name.Should().Be("Cookie Bites");
        payload.Analysis!.OverallStatus.Should().Be("Unknown");
    }

    private sealed record ScanResolutionPayload(string Mode, string ScannedCode, string? ResolvedGtin, string? Message);

    private sealed record ScanAnalysisPayload(ScanResolutionPayload Resolution, ProductDto? Product, AnalysisPayload? Analysis);

    private sealed record AnalysisPayload(string OverallStatus);
}
