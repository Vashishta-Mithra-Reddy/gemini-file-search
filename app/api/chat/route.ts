import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/genai";

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    try {
        const { message, history, storeId } = await req.json();
        const client = getGeminiClient(apiKey);

        const tools = [];
        if (storeId) {
            tools.push({
                fileSearch: {
                    fileSearchStoreNames: [storeId],
                },
            });
        }

        // Construct the full history for generateContent
        const contents = history.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        }));

        // Add the new user message
        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        const result = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                tools: tools,
            }
        });

        const text = result.text;
        const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

        return NextResponse.json({
            role: "model",
            content: text,
            groundingMetadata: groundingMetadata
        });

    } catch (error: any) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
