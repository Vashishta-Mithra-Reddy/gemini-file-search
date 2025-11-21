import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/genai";

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const client = getGeminiClient(apiKey);
        const stores = await client.fileSearchStores.list();
        // The SDK returns an async iterable or a list response.
        // Based on docs: `for await (const store of fileSearchStores) ...`
        // We need to collect them.

        const storeList = [];
        for await (const store of stores) {
            storeList.push(store);
        }

        return NextResponse.json({ fileSearchStores: storeList });
    } catch (error: any) {
        console.error("List stores error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const client = getGeminiClient(apiKey);

        const newStore = await client.fileSearchStores.create({
            config: { displayName: body.displayName || "New Store" }
        });

        return NextResponse.json(newStore);
    } catch (error: any) {
        console.error("Create store error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
