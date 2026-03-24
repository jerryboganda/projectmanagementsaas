using Amazon.S3;
using Amazon.S3.Model;
using LinearPrecision.Shared.Contracts;

namespace LinearPrecision.Api.Infrastructure.Storage;

/// <summary>
/// S3-compatible object storage implementation (works with AWS S3 and MinIO).
/// Requires <see cref="IAmazonS3"/> registered in DI and a "Storage" config section.
/// </summary>
public sealed class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public S3StorageService(IAmazonS3 s3, IConfiguration configuration)
    {
        _s3 = s3;
        _bucket = configuration["Storage:BucketName"] ?? "linear-precision";
    }

    public async Task<string> UploadAsync(string key, Stream stream, string contentType, CancellationToken ct = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false
        };
        await _s3.PutObjectAsync(request, ct);
        return key;
    }

    public async Task<Stream> DownloadAsync(string key, CancellationToken ct = default)
    {
        var response = await _s3.GetObjectAsync(_bucket, key, ct);
        return response.ResponseStream;
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        await _s3.DeleteObjectAsync(_bucket, key, ct);
    }

    public Task<string> GetPresignedUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiry),
            Verb = HttpVerb.GET
        };
        return Task.FromResult(_s3.GetPreSignedURL(request));
    }

    public Task<string> GetPresignedUploadUrlAsync(string key, TimeSpan expiry, CancellationToken ct = default)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = key,
            Expires = DateTime.UtcNow.Add(expiry),
            Verb = HttpVerb.PUT
        };
        return Task.FromResult(_s3.GetPreSignedURL(request));
    }
}
