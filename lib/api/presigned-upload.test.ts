import assert from "node:assert/strict";
import test from "node:test";
import { uploadFileToPresignedUrl } from "./presigned-upload";

test("uploadFileToPresignedUrl sends a PUT request with the file body and content type", async () => {
  let capturedUrl: RequestInfo | URL | undefined;
  let capturedInit: RequestInit | undefined;

  const file = new File(["board-data"], "board.txt", { type: "text/plain" });

  await uploadFileToPresignedUrl(
    "https://storage.test/upload/board.txt",
    file,
    async (input, init) => {
      capturedUrl = input;
      capturedInit = init;
      return new Response(null, { status: 200 });
    },
  );

  assert.equal(capturedUrl, "https://storage.test/upload/board.txt");
  assert.equal(capturedInit?.method, "PUT");
  assert.equal((capturedInit?.headers as Record<string, string>)["Content-Type"], "text/plain");
  assert.ok(capturedInit?.body instanceof File);
  assert.equal(await (capturedInit?.body as File).text(), "board-data");
});

test("uploadFileToPresignedUrl throws when object storage rejects the upload", async () => {
  const file = new File(["fail"], "board.txt", { type: "text/plain" });

  await assert.rejects(
    uploadFileToPresignedUrl(
      "https://storage.test/upload/board.txt",
      file,
      async () => new Response("denied", { status: 403, statusText: "Forbidden" }),
    ),
    /403/,
  );
});
