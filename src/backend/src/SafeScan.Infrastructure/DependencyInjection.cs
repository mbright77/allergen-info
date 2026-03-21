using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SafeScan.Application.Abstractions;
using SafeScan.Infrastructure.Configuration;
using SafeScan.Infrastructure.Providers.Caching;
using SafeScan.Infrastructure.Providers.Dabas;
using SafeScan.Infrastructure.Providers.Placeholder;

namespace SafeScan.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var options = BuildOptions(configuration);

        services.AddMemoryCache();
        services.AddSingleton<SearchQueryNormalizer>();
        services.AddSingleton(options);
        services.AddHttpClient<DabasProductCatalogSource>((_, client) => ConfigureDabasClient(client, options.Dabas));
        services.AddSingleton<IProductCatalogSource>(serviceProvider => CreateProductCatalogSource(serviceProvider, options));
        services.AddSingleton<CachedProductCatalogProvider>();
        services.AddSingleton<IProductCatalogProvider>(serviceProvider => serviceProvider.GetRequiredService<CachedProductCatalogProvider>());

        return services;
    }

    private static ProductCatalogOptions BuildOptions(IConfiguration configuration)
    {
        var section = configuration.GetSection(ProductCatalogOptions.SectionName);
        var dabasSection = section.GetSection("Dabas");

        return new ProductCatalogOptions
        {
            Provider = section["Provider"] ?? "Placeholder",
            Dabas = new DabasOptions
            {
                BaseUrl = dabasSection["BaseUrl"],
                ApiKey = dabasSection["ApiKey"],
                ApiKeyHeaderName = dabasSection["ApiKeyHeaderName"],
                ApiKeyQueryParameterName = dabasSection["ApiKeyQueryParameterName"]
            }
        };
    }

    private static void ConfigureDabasClient(HttpClient client, DabasOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.BaseUrl))
        {
            return;
        }

        client.BaseAddress = new Uri(options.BaseUrl, UriKind.Absolute);

        if (!string.IsNullOrWhiteSpace(options.ApiKey) && !string.IsNullOrWhiteSpace(options.ApiKeyHeaderName))
        {
            client.DefaultRequestHeaders.Remove(options.ApiKeyHeaderName);
            client.DefaultRequestHeaders.Add(options.ApiKeyHeaderName, options.ApiKey);
        }
    }

    private static IProductCatalogSource CreateProductCatalogSource(IServiceProvider serviceProvider, ProductCatalogOptions options)
    {
        return options.Provider.Equals("dabas", StringComparison.OrdinalIgnoreCase)
            ? serviceProvider.GetRequiredService<DabasProductCatalogSource>()
            : new PlaceholderProductCatalogProvider();
    }
}
