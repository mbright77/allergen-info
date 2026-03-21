using Microsoft.Extensions.DependencyInjection;
using SafeScan.Application.Abstractions;
using SafeScan.Infrastructure.Providers.Caching;
using SafeScan.Infrastructure.Providers.Placeholder;

namespace SafeScan.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddSingleton<IProductCatalogSource, PlaceholderProductCatalogProvider>();
        services.AddSingleton<SearchQueryNormalizer>();
        services.AddSingleton<CachedProductCatalogProvider>();
        services.AddSingleton<IProductCatalogProvider>(serviceProvider => serviceProvider.GetRequiredService<CachedProductCatalogProvider>());

        return services;
    }
}
