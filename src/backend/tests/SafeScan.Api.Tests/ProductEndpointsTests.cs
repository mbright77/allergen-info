using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SafeScan.Api.Tests;

public sealed class ProductEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SearchEndpoint_ReturnsPlaceholderResults()
    {
        var response = await _client.GetAsync("/api/products/search?q=oat");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ProductSearchPayload>();

        payload.Should().NotBeNull();
        payload!.Results.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SearchEndpoint_SerializesPreviewStatusAsString()
    {
        var response = await _client.GetAsync("/api/products/search?q=oat%20milk");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var firstResult = document.RootElement.GetProperty("results")[0];

        firstResult.GetProperty("previewStatus").ValueKind.Should().Be(JsonValueKind.String);
        firstResult.GetProperty("previewStatus").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task SearchEndpoint_NormalizesEquivalentQueries()
    {
        var firstResponse = await _client.GetFromJsonAsync<ProductSearchPayload>("/api/products/search?q=OAT%20%20MILK");
        var secondResponse = await _client.GetFromJsonAsync<ProductSearchPayload>("/api/products/search?q=oat%20milk");

        firstResponse.Should().NotBeNull();
        secondResponse.Should().NotBeNull();
        firstResponse!.Results.Should().HaveSameCount(secondResponse!.Results);
    }

    [Fact]
    public async Task ReferenceEndpoint_ReturnsAllergens()
    {
        var response = await _client.GetAsync("/api/reference/allergens");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<List<AllergenPayload>>();

        payload.Should().NotBeNull();
        payload!.Should().Contain(item => item.Code == "milk_protein");
    }

    [Fact]
    public async Task ScanAnalysisEndpoint_ReturnsNotFoundWhenNoProductMatches()
    {
        var response = await _client.PostAsJsonAsync("/api/analysis/scan", new
        {
            code = "0000000000000",
            selectedAllergens = Array.Empty<string>()
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<ScanAnalysisPayload>();

        payload.Should().NotBeNull();
        payload!.Resolution.Mode.Should().Be("NotFound");
    }

    private sealed record ProductSearchPayload(string Query, IReadOnlyList<object> Results);

    private sealed record ScanResolutionPayload(string Mode, string ScannedCode, string? ResolvedGtin, string? Message);

    private sealed record ScanAnalysisPayload(ScanResolutionPayload Resolution);

    private sealed record AllergenPayload(string Code, string Label);
}
