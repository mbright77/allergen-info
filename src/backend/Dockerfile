FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY SafeScan.sln ./
COPY src/SafeScan.Api/SafeScan.Api.csproj src/SafeScan.Api/
COPY src/SafeScan.Application/SafeScan.Application.csproj src/SafeScan.Application/
COPY src/SafeScan.Domain/SafeScan.Domain.csproj src/SafeScan.Domain/
COPY src/SafeScan.Infrastructure/SafeScan.Infrastructure.csproj src/SafeScan.Infrastructure/
COPY tests/ ./tests/

RUN dotnet restore SafeScan.sln -p:Configuration=Release

COPY src/ ./src/
COPY tests/ ./tests/
RUN dotnet publish src/SafeScan.Api/SafeScan.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SafeScan.Api.dll"]
