using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SafeScan.Application.Abstractions;
using SafeScan.Infrastructure;
using SafeScan.Infrastructure.Configuration;
using SafeScan.Infrastructure.Providers.Dabas;

namespace SafeScan.Api.Tests;

public sealed class DabasProductCatalogSourceTests
{
    [Fact]
    public async Task SearchProductsAsync_UsesSearchParameterAndMapsNormalizedResults()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            request.RequestUri!.ToString().Should().Contain("searchparameter/oat milk/json");

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "1735000111001",
                          "Produktnamn": "The Original Oat Milk",
                          "Hyllkantstext": "Clean label oat drink",
                          "Varumarke": "Oatly",
                          "Artikelkategori": "Beverage",
                          "Bilder": [
                            {
                              "Informationstyp": "PRODUCT_IMAGE_THUMB",
                              "Lank": "https://cdn.example.test/oat-thumb.jpg",
                              "Sekvensnummer": 1
                            },
                            {
                              "Informationstyp": "PRODUCT_IMAGE_MEDIUM",
                              "Lank": "https://cdn.example.test/oat-medium.jpg",
                              "Sekvensnummer": 1
                            }
                          ],
                          "Forpackningsstorlek": "1 l",
                          "TillverkarensArtikelnummer": "OAT-1001",
                          "Artikeltyp": "BaseArticle",
                          "SenastAndradDatum": "2026-03-21T10:00:00Z"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            };
        });

        var source = CreateDabasSource(handler);

        var results = await source.SearchProductsAsync("oat milk", []);

        results.Should().ContainSingle();
        var result = results.Single();
        result.Gtin.Should().Be("1735000111001");
        result.Name.Should().Be("The Original Oat Milk");
        result.Brand.Should().Be("Oatly");
        result.ImageUrl.Should().Be("https://cdn.example.test/oat-medium.jpg");
        result.Source.Should().Be("dabas-search");
        handler.Requests.Should().HaveCount(1);
    }

    [Fact]
    public async Task SearchProductsAsync_FallsBackToBroadSearchAndAppendsApiKeyQueryParameter()
    {
        var handler = new StubHttpMessageHandler(request =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "Results": [
                        {
                          "GTIN": "1735000111004",
                          "Artikelbenamning": "Milk Chocolate Bar"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            });

        var source = CreateDabasSource(
            handler,
            new ProductCatalogOptions
            {
                Provider = "Dabas",
                Dabas = new DabasOptions
                {
                    BaseUrl = "https://api.dabas.test/",
                    ApiKey = "secret-key",
                    ApiKeyQueryParameterName = "apikey"
                }
            });

        var results = await source.SearchProductsAsync("chocolate", []);

        results.Should().ContainSingle();
        results.Single().Gtin.Should().Be("1735000111004");
        handler.Requests.Should().ContainSingle();
        handler.Requests[0].Should().Contain("searchparameter/chocolate/json");
        handler.Requests[0].Should().Contain("apikey=secret-key");
    }

    [Fact]
    public async Task SearchProductsAsync_RanksExactGtinMatchFirst()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "ArticleDateModel": [
                        {
                          "GTIN": "9999999999999",
                          "Produktnamn": "Another Product"
                        },
                        {
                          "GTIN": "1735000111001",
                          "Produktnamn": "The Original Oat Milk"
                        }
                      ]
                    }
                    """,
                    Encoding.UTF8,
                    "application/json")
            });

        var source = CreateDabasSource(handler);

        var results = await source.SearchProductsAsync("1735000111001", []);

        results.Should().HaveCount(2);
        results[0].Gtin.Should().Be("1735000111001");
    }

    [Fact]
    public async Task GetProductByGtinAsync_MapsProductDetailsAndAllergenStatements()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "Article": {
                        "GTIN": "1735000111004",
                        "Produktnamn": "Milk Chocolate Bar",
                        "Varumarke": "Marabou",
                        "Artikelkategori": "Chocolate",
                        "Hyllkantstext": "Classic milk chocolate",
                        "Ingrediensforteckning": "Sugar, whey powder (milk), soy lecithin.",
                        "EnergiKcal": 550,
                        "SockerGram": 58,
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
                    """,
                    Encoding.UTF8,
                    "application/json")
            });

        var source = CreateDabasSource(handler);

        var product = await source.GetProductByGtinAsync("1735000111004");

        product.Should().NotBeNull();
        product!.Name.Should().Be("Milk Chocolate Bar");
        product.ContainsAllergens.Should().BeEquivalentTo(["milk", "soybeans"]);
        product.MayContainAllergens.Should().BeEquivalentTo(["tree_nuts"]);
        product.Source.Should().Be("dabas");
        product.NutritionSummary!.EnergyKcal.Should().Be(550);
    }

    [Fact]
    public void AddInfrastructure_SelectsDabasSourceWhenConfigured()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ProductCatalog:Provider"] = "Dabas",
                ["ProductCatalog:Dabas:BaseUrl"] = "https://api.dabas.test/"
            })
            .Build();

        services.AddSingleton<IProductAnalysisService, SafeScan.Application.Services.ProductAnalysisService>();
        services.AddInfrastructure(configuration);

        using var serviceProvider = services.BuildServiceProvider();
        var source = serviceProvider.GetRequiredService<IProductCatalogSource>();

        source.Should().BeOfType<DabasProductCatalogSource>();
    }

    private static DabasProductCatalogSource CreateDabasSource(
        HttpMessageHandler handler,
        ProductCatalogOptions? options = null)
    {
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.dabas.test/")
        };

        return new DabasProductCatalogSource(
            httpClient,
            options ?? new ProductCatalogOptions
            {
                Provider = "Dabas",
                Dabas = new DabasOptions
                {
                    BaseUrl = "https://api.dabas.test/"
                }
            });
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        public List<string> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request.RequestUri!.ToString());
            return Task.FromResult(_responseFactory(request));
        }
    }
}
