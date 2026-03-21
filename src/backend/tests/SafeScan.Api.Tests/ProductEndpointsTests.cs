using System.Net;
using System.Net.Http.Json;
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
    public async Task SearchEndpoint_NormalizesEquivalentQueries()
    {
        var firstResponse = await _client.GetFromJsonAsync<ProductSearchPayload>("/api/products/search?q=OAT%20%20MILK");
        var secondResponse = await _client.GetFromJsonAsync<ProductSearchPayload>("/api/products/search?q=oat%20milk");

        firstResponse.Should().NotBeNull();
        secondResponse.Should().NotBeNull();
        firstResponse!.Results.Should().HaveSameCount(secondResponse!.Results);
    }

    private sealed record ProductSearchPayload(string Query, IReadOnlyList<object> Results);
}
