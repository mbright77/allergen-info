using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using SafeScan.Api.Endpoints;
using SafeScan.Application.Abstractions;
using SafeScan.Application.Services;
using SafeScan.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration["AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];
Console.WriteLine("Allowed origins: " + string.Join(", ", allowedOrigins));
var pathBase = builder.Configuration["PathBase"]?.TrimEnd('/');

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddSingleton<IProductAnalysisService, ProductAnalysisService>();
builder.Services.AddSingleton<IScanProductAnalysisService, ScanProductAnalysisService>();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseForwardedHeaders();

if (!string.IsNullOrWhiteSpace(pathBase) && pathBase != "/")
{
    app.UsePathBase(pathBase);
}

app.UseExceptionHandler();
app.UseCors("Frontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

var apiGroup = app.MapGroup("/api");

apiGroup.MapReferenceEndpoints();
apiGroup.MapProductEndpoints();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("HealthCheck")
    .WithOpenApi();

app.Run();

public partial class Program;
