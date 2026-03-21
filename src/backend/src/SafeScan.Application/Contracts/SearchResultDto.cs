using SafeScan.Domain.Products;

namespace SafeScan.Application.Contracts;

public sealed record SearchResultDto(
    string Gtin,
    string Name,
    string? Subtitle,
    string? Brand,
    string? Category,
    string? PackageSize,
    string? ArticleNumber,
    string? ArticleType,
    AnalysisOverallStatus? PreviewStatus,
    string? PreviewBadge,
    string? PreviewNote,
    DateTimeOffset UpdatedAt,
    string Source);
