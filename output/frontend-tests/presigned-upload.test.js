"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const presigned_upload_1 = require("./presigned-upload");
(0, node_test_1.default)("uploadFileToPresignedUrl sends a PUT request with the file body and content type", async () => {
    let capturedUrl;
    let capturedInit;
    const file = new File(["board-data"], "board.txt", { type: "text/plain" });
    await (0, presigned_upload_1.uploadFileToPresignedUrl)("https://storage.test/upload/board.txt", file, async (input, init) => {
        capturedUrl = input;
        capturedInit = init;
        return new Response(null, { status: 200 });
    });
    strict_1.default.equal(capturedUrl, "https://storage.test/upload/board.txt");
    strict_1.default.equal(capturedInit?.method, "PUT");
    strict_1.default.equal((capturedInit?.headers)["Content-Type"], "text/plain");
    strict_1.default.ok(capturedInit?.body instanceof File);
    strict_1.default.equal(await (capturedInit?.body).text(), "board-data");
});
(0, node_test_1.default)("uploadFileToPresignedUrl throws when object storage rejects the upload", async () => {
    const file = new File(["fail"], "board.txt", { type: "text/plain" });
    await strict_1.default.rejects((0, presigned_upload_1.uploadFileToPresignedUrl)("https://storage.test/upload/board.txt", file, async () => new Response("denied", { status: 403, statusText: "Forbidden" })), /403/);
});
