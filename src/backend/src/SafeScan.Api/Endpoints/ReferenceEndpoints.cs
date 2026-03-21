using SafeScan.Application.Abstractions;

namespace SafeScan.Api.Endpoints;

public static class ReferenceEndpoints
{
    public static RouteGroupBuilder MapReferenceEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/reference/allergens", GetAllergens)
            .WithName("GetAllergens")
            .WithOpenApi();

        return group;
    }

    private static async Task<IResult> GetAllergens(
        IProductCatalogProvider provider,
        CancellationToken cancellationToken)
    {
        var allergens = await provider.GetAllergensAsync(cancellationToken);
        return Results.Ok(allergens);
    }
}
