"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Plus, Trash, Upload, MessageSquare, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilesView } from "./FilesView";
import { ChatView } from "./ChatView";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Types
interface Store {
    name: string; // resource name
    displayName: string;
}

export default function Playground() {
    const [apiKey, setApiKey] = useState("");
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"files" | "chat">("files");
    const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
    const [newStoreName, setNewStoreName] = useState("");

    // Load API key from local storage
    useEffect(() => {
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);
    }, []);

    const saveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("gemini_api_key", key);
    };

    const fetchStores = async () => {
        // If no API key in state, we might still want to try if there's a dev key on server?
        // But for now, let's require it or rely on the server to handle missing header if it has a fallback.
        // The user said "bring your own api key" for production, but env var for dev.
        // We'll try to fetch. If the server returns 401, then we know we need a key.

        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch("/api/stores", { headers });
            if (res.status === 401) {
                // If 401, it means no key provided and no dev key on server.
                // We can just stop here or show empty.
                setLoading(false);
                return;
            }

            const data = await res.json();
            if (data.fileSearchStores) {
                setStores(data.fileSearchStores);
            } else if (data.error) {
                toast.error("Failed to fetch stores: " + data.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch stores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch stores on load (might use dev key) or when apiKey changes
        fetchStores();
    }, [apiKey]);

    const createStore = async () => {
        if (!newStoreName) return;

        const toastId = toast.loading("Creating store...");
        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch("/api/stores", {
                method: "POST",
                headers,
                body: JSON.stringify({ displayName: newStoreName }),
            });
            const newStore = await res.json();
            if (newStore.error) throw new Error(newStore.error);

            setStores([...stores, newStore]);
            setSelectedStore(newStore);
            toast.success("Store created", { id: toastId });
            setIsCreateStoreOpen(false);
            setNewStoreName("");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to create store: " + error.message, { id: toastId });
        }
    };

    const deleteStore = async (storeId: string) => {
        if (!confirm("Are you sure?")) return;
        const toastId = toast.loading("Deleting store...");
        try {
            const headers: Record<string, string> = {};
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            await fetch(`/api/stores/${encodeURIComponent(storeId)}`, {
                method: "DELETE",
                headers,
            });
            setStores(stores.filter((s) => s.name !== storeId));
            if (selectedStore?.name === storeId) setSelectedStore(null);
            toast.success("Store deleted", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete store", { id: toastId });
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-outfit">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/20 p-4 flex flex-col">
                <div className="mb-6">
                    <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-primary">✦</span> Gemini File Search
                    </h1>
                    <div className="relative">
                        <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="password"
                            placeholder="API Key (Optional in Dev)"
                            value={apiKey}
                            onChange={(e) => saveApiKey(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">Stores</h2>
                        <Dialog open={isCreateStoreOpen} onOpenChange={setIsCreateStoreOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Store</DialogTitle>
                                    <DialogDescription>
                                        Enter a name for your new File Search Store.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <Input
                                        id="name"
                                        placeholder="Store Name"
                                        value={newStoreName}
                                        onChange={(e) => setNewStoreName(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={createStore} disabled={!newStoreName}>Create</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-1">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : (
                            stores.map((store) => (
                                <button
                                    key={store.name}
                                    onClick={() => setSelectedStore(store)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                                        selectedStore?.name === store.name
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <span className="truncate">{store.displayName}</span>
                                    <Trash
                                        className="h-3 w-3 opacity-0 group-hover:opacity-50 hover:!opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteStore(store.name);
                                        }}
                                    />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {selectedStore ? (
                    <>
                        <div className="border-b p-4 flex items-center justify-between bg-card">
                            <div>
                                <h2 className="text-lg font-semibold">{selectedStore.displayName}</h2>
                                <p className="text-xs text-muted-foreground">{selectedStore.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={activeTab === "files" ? "default" : "outline"}
                                    onClick={() => setActiveTab("files")}
                                    size="sm"
                                >
                                    <FileText className="h-4 w-4 mr-2" /> Files
                                </Button>
                                <Button
                                    variant={activeTab === "chat" ? "default" : "outline"}
                                    onClick={() => setActiveTab("chat")}
                                    size="sm"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" /> Chat
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-auto">
                            {activeTab === "files" ? (
                                <FilesView store={selectedStore} apiKey={apiKey} />
                            ) : (
                                <ChatView store={selectedStore} apiKey={apiKey} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a store to get started
                    </div>
                )}
            </div>
        </div>
    );
}
