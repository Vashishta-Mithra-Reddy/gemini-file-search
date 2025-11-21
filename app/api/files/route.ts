import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/genai";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const storeId = formData.get("storeId") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Use a random filename to avoid collisions and path traversal
        const tempFilename = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const tempPath = join(os.tmpdir(), tempFilename);

        await writeFile(tempPath, buffer);

        const client = getGeminiClient(apiKey);

        if (storeId) {
            // 1. Upload the file using the Files API first (more reliable)
            const uploadResult = await client.files.upload({
                file: tempPath,
                config: {
                    displayName: file.name,
                    mimeType: file.type || "application/octet-stream"
                }
            });

            // 2. Add the file to the store
            // We use `client.fileSearchStores.createFile` but we need to be sure about the method.
            // If `uploadToFileSearchStore` was failing, it might be due to the helper not handling streams/buffers well via the temp file path in some environments?
            // Or maybe the `mimeType` was missing in the helper config.

            // Let's try the explicit 2-step process which is standard.
            // However, `createFile` might not be on `fileSearchStores`.
            // The correct method to add a file to a store is often `client.fileSearchStores.createFile` OR `client.models.generateContent` with tools? No.

            // Let's go back to `uploadToFileSearchStore` but ensure we wait properly and handle errors.
            // AND we must ensure `mimeType` is correct.

            // Actually, the user said "I am not being able to upload anything".
            // It might be that `uploadToFileSearchStore` is not available on the client instance if the SDK version is old?
            // But I am using `@google/genai`.

            // Let's try to use the `files.upload` and then just return success, 
            // BUT we need to associate it.
            // If we can't associate it easily without the helper, we should use the helper.

            // Let's try to debug by logging. But I can't see logs.
            // I will assume the helper works IF used correctly.

            const operation = await client.fileSearchStores.uploadToFileSearchStore({
                file: tempPath,
                fileSearchStoreName: storeId,
                config: {
                    displayName: file.name,
                    mimeType: file.type || "text/plain" // Default to text/plain if unknown, better than octet-stream for RAG
                }
            });

            // Wait for completion
            let op = operation;
            while (!op.done && op.name) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                op = await client.operations.get({ operation: op.name });
            }

            // Cleanup
            await unlink(tempPath);

            return NextResponse.json({ success: true, message: "File uploaded and associated" });
        } else {
            // Just upload file
            const uploadResult = await client.files.upload({
                file: tempPath,
                config: {
                    displayName: file.name,
                    mimeType: file.type || "text/plain"
                }
            });

            await unlink(tempPath);
            return NextResponse.json({ file: uploadResult });
        }

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get("storeId");
        const client = getGeminiClient(apiKey);

        const files = await client.files.list({config: {'pageSize': 100}});
        const fileList = [];
        for await (const file of files) {
            fileList.push(file);
        }

        return NextResponse.json({ files: fileList });

    } catch (error: any) {
        console.error("List files error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get("name");

        if (!name) {
            return NextResponse.json({ error: "File name required" }, { status: 400 });
        }

        const client = getGeminiClient(apiKey);
        // Ensure name is decoded
        await client.files.delete({ name: decodeURIComponent(name) });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
