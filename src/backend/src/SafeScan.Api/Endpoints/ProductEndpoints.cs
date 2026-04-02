using Microsoft.AspNetCore.Mvc;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Contracts;

namespace SafeScan.Api.Endpoints;

public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/products/gtin/{gtin}", GetProductByGtin)
            .WithName("GetProductByGtin")
            .WithOpenApi();

        group.MapGet("/products/search", SearchProducts)
            .WithName("SearchProducts")
            .WithOpenApi();

        group.MapPost("/analysis", AnalyzeProduct)
            .WithName("AnalyzeProduct")
            .WithOpenApi();

        group.MapPost("/analysis/scan", AnalyzeScannedProduct)
            .WithName("AnalyzeScannedProduct")
            .WithOpenApi();

        return group;
    }

    private static async Task<IResult> GetProductByGtin(
        string gtin,
        IProductCatalogProvider provider,
        CancellationToken cancellationToken)
    {
        var product = await provider.GetProductByGtinAsync(gtin, cancellationToken);

        return product is null
            ? Results.NotFound(new ProblemDetails
            {
                Title = "Product not found",
                Detail = $"No product was found for GTIN '{gtin}'.",
                Status = StatusCodes.Status404NotFound
            })
            : Results.Ok(new ProductLookupResponse(product.ToDto()));
    }

    private static async Task<IResult> SearchProducts(
        [FromQuery] string q,
        [FromQuery] string[]? selectedAllergens,
        IProductCatalogProvider provider,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.BadRequest(new ProblemDetails
            {
                Title = "Missing query",
                Detail = "Query parameter 'q' is required.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var results = await provider.SearchProductsAsync(q, selectedAllergens ?? [], cancellationToken);

        return Results.Ok(new ProductSearchResponse(q, results));
    }

    private static async Task<IResult> AnalyzeProduct(
        AnalysisRequest request,
        IProductCatalogProvider provider,
        IProductAnalysisService analysisService,
        CancellationToken cancellationToken)
    {
        var product = await provider.GetProductByGtinAsync(request.Gtin, cancellationToken);

        if (product is null)
        {
            return Results.NotFound(new ProblemDetails
            {
                Title = "Product not found",
                Detail = $"No product was found for GTIN '{request.Gtin}'.",
                Status = StatusCodes.Status404NotFound
            });
        }

        var analysis = analysisService.Analyze(product, request.SelectedAllergens);

        return Results.Ok(new AnalysisResponse(product.ToDto(), analysis));
    }

    private static async Task<IResult> AnalyzeScannedProduct(
        ScanAnalysisRequest request,
        IScanProductAnalysisService scanAnalysisService,
        CancellationToken cancellationToken)
    {
        var response = await scanAnalysisService.AnalyzeScanAsync(request, cancellationToken);
        return Results.Ok(response);
    }
}
