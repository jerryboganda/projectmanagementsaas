using System.Text.Json;
using System.Text.Json.Serialization;

namespace LinearPrecision.Integration.Tests.Helpers;

public static class IntegrationJsonOptions
{
    public static JsonSerializerOptions SerializerOptions { get; } = CreateSerializerOptions();

    private static JsonSerializerOptions CreateSerializerOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());

        return options;
    }
}