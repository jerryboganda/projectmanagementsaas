namespace LinearPrecision.Api.Modules.Files.Models;

public sealed record PresignUploadRequest(string FileName, string ContentType, long SizeBytes);
public sealed record PresignUploadResponse(Guid FileId, string UploadUrl, string StorageKey, string StorageBucket);
public sealed record FileConfirmResponse(Guid Id, string FileName, string ContentType, long SizeBytes, string StorageKey, string? ThumbnailKey, Guid UploadedBy, DateTime CreatedAt);
public sealed record FileDownloadUrlResponse(string DownloadUrl, string FileName, string ContentType, long SizeBytes);
