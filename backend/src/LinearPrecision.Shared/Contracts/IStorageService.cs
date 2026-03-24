namespace LinearPrecision.Shared.Contracts;

/// <summary>
/// Abstraction for S3-compatible object storage.
/// </summary>
public interface IStorageService
{
    Task<string> UploadAsync(string key, Stream stream, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
    /// <summary>Returns a pre-signed GET URL for the given storage key.</summary>
    Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default);
    /// <summary>Returns a pre-signed PUT URL so clients can upload directly to object storage.</summary>
    Task<string> GetPresignedUploadUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default);
}
