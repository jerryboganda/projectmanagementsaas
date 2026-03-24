"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToPresignedUrl = uploadFileToPresignedUrl;
async function uploadFileToPresignedUrl(uploadUrl, file, fetchImpl = fetch) {
    const response = await fetchImpl(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Presigned upload failed with status ${response.status}${detail ? `: ${detail}` : ""}`);
    }
}
