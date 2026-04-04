using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Allergens;
using SafeScan.Application.Contracts;
using SafeScan.Application.Services;
using SafeScan.Infrastructure.Providers.Caching;

namespace SafeScan.Api.Tests;

public sealed class CachedProductCatalogProviderTests
{
    [Fact]
    public async Task SearchProductsAsync_NormalizesQueryAndCachesEquivalentRequests()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var innerProvider = new FakeProductCatalogProvider();
        var provider = new CachedProductCatalogProvider(
            innerProvider,
            cache,
            new ProductAnalysisService(),
            new SearchQueryNormalizer());

        var firstResult = await provider.SearchProductsAsync("  Oat   Milk  ", ["cereals_containing_gluten"]);
        var secondResult = await provider.SearchProductsAsync("oat milk", ["cereals_containing_gluten"]);

        firstResult.Should().HaveCount(1);
        secondResult.Should().HaveCount(1);
        innerProvider.SearchCallCount.Should().Be(1);
    }

    [Fact]
    public async Task SearchProductsAsync_EnrichesMissingPreviewAndCachesProductLookup()
    {
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var innerProvider = new FakeProductCatalogProvider(includePreview: false);
        var provider = new CachedProductCatalogProvider(
            innerProvider,
            cache,
            new ProductAnalysisService(),
            new SearchQueryNormalizer());

        var firstResult = await provider.SearchProductsAsync("chocolate", ["milk"]);
        var secondResult = await provider.SearchProductsAsync("chocolate", ["milk"]);

        firstResult.Single().PreviewStatus.Should().Be(SafeScan.Domain.Products.AnalysisOverallStatus.Contains);
        firstResult.Single().PreviewBadge.Should().NotBeNullOrWhiteSpace();
        innerProvider.SearchCallCount.Should().Be(1);
        innerProvider.ProductLookupCallCount.Should().Be(1);
        secondResult.Single().PreviewStatus.Should().Be(SafeScan.Domain.Products.AnalysisOverallStatus.Contains);
    }

    private sealed class FakeProductCatalogProvider : IProductCatalogSource
    {
        private readonly bool _includePreview;

        public FakeProductCatalogProvider(bool includePreview = true)
        {
            _includePreview = includePreview;
        }

        public int SearchCallCount { get; private set; }

        public int ProductLookupCallCount { get; private set; }

        public Task<IReadOnlyList<AllergenOptionDto>> GetAllergensAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<AllergenOptionDto>>([new("cereals_containing_gluten", "Cereals containing gluten")]);

        public Task<ProductRecord?> GetProductByGtinAsync(string gtin, CancellationToken cancellationToken = default)
        {
            ProductLookupCallCount++;

            return Task.FromResult<ProductRecord?>(new ProductRecord(
                gtin,
                "Test Chocolate",
                "SafeScan",
                "Chocolate",
                "Test product",
                "Sugar, whey powder (milk)",
                AllergenCatalog.BuildFacts(["milk"], SafeScan.Domain.Products.AllergenMatchStatus.Contains),
                ["milk"],
                [],
                [new IngredientHighlightDto("whey powder (milk)", SafeScan.Domain.Products.AllergenMatchStatus.Contains, "milk")],
                new NutritionSummaryDto(500, 45m),
                null,
                "test",
                null,
                null));
        }

        public Task<IReadOnlyList<SearchResultDto>> SearchProductsAsync(
            string query,
            IReadOnlyCollection<string> selectedAllergens,
            CancellationToken cancellationToken = default)
        {
            SearchCallCount++;

            return Task.FromResult<IReadOnlyList<SearchResultDto>>(
            [
                new SearchResultDto(
                    "1234567890123",
                    "Test Chocolate",
                    "Test product",
                    "SafeScan",
                    "Chocolate",
                    "100 g",
                    "TEST-1",
                    "BaseArticle",
                    _includePreview ? SafeScan.Domain.Products.AnalysisOverallStatus.Contains : null,
                    _includePreview ? "Contains allergens" : null,
                    _includePreview ? "Preview note" : null,
                    DateTimeOffset.Parse("2026-03-21T10:00:00Z"),
                    "test")
            ]);
        }
    }
}
