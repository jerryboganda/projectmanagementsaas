using System.Text.Json;

namespace LinearPrecision.Api.Infrastructure.Persistence.Auditing;

/// <summary>
/// F-07 — Redacts sensitive properties from audit payloads before persisting.
/// Operates on either an <see cref="IDictionary{TKey, TValue}"/> (typical EF
/// Core change-tracker output) or arbitrary JSON.
/// </summary>
public static class AuditRedactor
{
    /// <summary>
    /// Returns a new dictionary with values for properties listed in
    /// <see cref="SensitiveFieldRegistry.RedactedPropertyNames"/> replaced by
    /// <see cref="SensitiveFieldRegistry.RedactedPlaceholder"/>.
    /// </summary>
    public static IDictionary<string, object?> Redact(IDictionary<string, object?> source)
    {
        ArgumentNullException.ThrowIfNull(source);
        var copy = new Dictionary<string, object?>(source.Count, StringComparer.Ordinal);
        foreach (var (key, value) in source)
        {
            copy[key] = SensitiveFieldRegistry.RedactedPropertyNames.Contains(key)
                ? SensitiveFieldRegistry.RedactedPlaceholder
                : value;
        }
        return copy;
    }

    /// <summary>
    /// Round-trips a JSON document, replacing values of sensitive keys with the
    /// redaction placeholder. Returns the redacted JSON as a UTF-8 string.
    /// </summary>
    public static string RedactJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return json;

        using var doc = JsonDocument.Parse(json);
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            WriteRedacted(doc.RootElement, writer);
        }
        return System.Text.Encoding.UTF8.GetString(stream.ToArray());
    }

    private static void WriteRedacted(JsonElement element, Utf8JsonWriter writer)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var prop in element.EnumerateObject())
                {
                    writer.WritePropertyName(prop.Name);
                    if (SensitiveFieldRegistry.RedactedPropertyNames.Contains(prop.Name))
                    {
                        writer.WriteStringValue(SensitiveFieldRegistry.RedactedPlaceholder);
                    }
                    else
                    {
                        WriteRedacted(prop.Value, writer);
                    }
                }
                writer.WriteEndObject();
                break;

            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray())
                {
                    WriteRedacted(item, writer);
                }
                writer.WriteEndArray();
                break;

            default:
                element.WriteTo(writer);
                break;
        }
    }
}
