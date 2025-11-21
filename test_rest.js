const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Please set GEMINI_API_KEY env var");
    process.exit(1);
}

async function test() {
    // 1. Create Store
    console.log("Creating store...");
    const createRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Test Store REST" })
    });
    const store = await createRes.json();
    console.log("Store created:", store.name);

    // 2. Upload File (Standard)
    // We need a file.
    // Actually, let's just try to list files in the store.

    // 3. Try to add a file?
    // The endpoint might be `POST https://generativelanguage.googleapis.com/v1beta/${store.name}/files`
    // But we need a file resource name first.
    // Let's assume we have a file.

    // Clean up
    console.log("Deleting store...");
    await fetch(`https://generativelanguage.googleapis.com/v1beta/${store.name}?key=${apiKey}`, {
        method: "DELETE"
    });
}

test().catch(console.error);
