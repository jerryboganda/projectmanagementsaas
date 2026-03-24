FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/LinearPrecision.Worker/LinearPrecision.Worker.csproj", "src/LinearPrecision.Worker/"]
COPY ["src/LinearPrecision.Api/LinearPrecision.Api.csproj", "src/LinearPrecision.Api/"]
COPY ["src/LinearPrecision.Shared/LinearPrecision.Shared.csproj", "src/LinearPrecision.Shared/"]
RUN dotnet restore "src/LinearPrecision.Worker/LinearPrecision.Worker.csproj"
COPY . .
WORKDIR "/src/src/LinearPrecision.Worker"
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "LinearPrecision.Worker.dll"]
