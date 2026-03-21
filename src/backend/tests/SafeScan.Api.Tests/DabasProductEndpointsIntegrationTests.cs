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
            return request.RequestUri!.ToString().Contains("basesearchparameter", StringComparison.Ordinal)
                ? DabasApiWebApplicationFactory.Json(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111001",
                          "Produktnamn": "The Original Oat Milk",
                          "Varumarke": "Oatly",
                          "Artikelkategori": "Beverage",
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
        payload.Results[0].Source.Should().Be("dabas-search");
        factory.Requests.Should().ContainSingle(request => request.Contains("basesearchparameter/oat milk/json"));
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
                    "AllergenInformation": {
                      "Innehaller": ["Milk", "Soy"],
                      "KanInnehalla": ["Nuts"]
                    }
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
        payload.Product.AllergenStatements.Contains.Should().BeEquivalentTo(["milk_protein", "soy"]);
    }

}
