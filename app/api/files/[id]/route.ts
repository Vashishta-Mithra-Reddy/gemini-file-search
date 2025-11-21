import { getFileManager } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const apiKey = req.headers.get("x-gemini-api-key");
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { id } = await params;
        // id is the file name, e.g. "files/..."
        // It might be URL encoded.
        const fileName = decodeURIComponent(id);

        const fileManager = getFileManager(apiKey);
        await fileManager.deleteFile(fileName);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
