using System.Net;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SafeScan.Infrastructure.Providers.Dabas;

namespace SafeScan.Api.Tests;

public sealed class DabasApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;

    public DabasApiWebApplicationFactory(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
    {
        _responseFactory = responseFactory;
    }

    public List<string> Requests { get; } = [];

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ProductCatalog:Provider", "Dabas");
        builder.UseSetting("ProductCatalog:Dabas:BaseUrl", "https://api.dabas.test/");

        builder.ConfigureServices(services =>
        {
            services.AddHttpClient<DabasProductCatalogSource>()
                .ConfigurePrimaryHttpMessageHandler(() => new RecordingHttpMessageHandler(_responseFactory, Requests));
        });
    }

    private sealed class RecordingHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;
        private readonly List<string> _requests;

        public RecordingHttpMessageHandler(
            Func<HttpRequestMessage, HttpResponseMessage> responseFactory,
            List<string> requests)
        {
            _responseFactory = responseFactory;
            _requests = requests;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            _requests.Add(request.RequestUri!.ToString());
            return Task.FromResult(_responseFactory(request));
        }
    }

    public static HttpResponseMessage Json(string body, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
    }
}
