FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/LinearPrecision.Api/LinearPrecision.Api.csproj", "src/LinearPrecision.Api/"]
COPY ["src/LinearPrecision.Shared/LinearPrecision.Shared.csproj", "src/LinearPrecision.Shared/"]
RUN dotnet restore "src/LinearPrecision.Api/LinearPrecision.Api.csproj"
COPY . .
WORKDIR "/src/src/LinearPrecision.Api"
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "LinearPrecision.Api.dll"]
