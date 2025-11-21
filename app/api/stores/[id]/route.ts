import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/genai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { id } = await params;
        // id might be encoded. The SDK expects the full resource name.
        const storeName = decodeURIComponent(id);

        const client = getGeminiClient(apiKey);
        const store = await client.fileSearchStores.get({ name: storeName });

        return NextResponse.json(store);
    } catch (error: any) {
        console.error("Get store error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const storeName = decodeURIComponent(id);

        const client = getGeminiClient(apiKey);
        await client.fileSearchStores.delete({ name: storeName, config: { force: true } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete store error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
