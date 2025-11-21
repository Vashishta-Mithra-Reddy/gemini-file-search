import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash, FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FilesViewProps {
    store: any;
    apiKey: string;
}

interface FileItem {
    name: string;
    displayName: string;
    mimeType: string;
    sizeBytes: string;
    createTime: string;
    state: string;
    uri: string;
}

export function FilesView({ store, apiKey }: FilesViewProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch(`/api/files?storeId=${encodeURIComponent(store.name)}`, { headers });
            const data = await res.json();

            if (data.error) throw new Error(data.error);
            setFiles(data.files || []);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to fetch files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [store.name]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading("Uploading file...");
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("storeId", store.name);

            const headers: Record<string, string> = {};
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch("/api/files", {
                method: "POST",
                headers, // Do not set Content-Type for FormData
                body: formData,
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast.success("File uploaded", { id: toastId });
            fetchFiles();
        } catch (error: any) {
            console.error(error);
            toast.error("Upload failed: " + error.message, { id: toastId });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const deleteFile = async (fileName: string) => {
        if (!confirm("Delete this file?")) return;
        const toastId = toast.loading("Deleting file...");
        try {
            const headers: Record<string, string> = {};
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch(`/api/files?name=${encodeURIComponent(fileName)}`, {
                method: "DELETE",
                headers,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }

            setFiles(files.filter((f) => f.name !== fileName));
            toast.success("File deleted", { id: toastId });
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to delete file: " + error.message, { id: toastId });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files in {store.displayName}</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchFiles} disabled={loading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <Button asChild size="sm" disabled={uploading}>
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                {uploading ? "Uploading..." : "Upload File"}
                            </label>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-3">State</div>
                    <div className="col-span-3">Created</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="max-h-[400px] overflow-auto">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            ))}
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No files found in this store.</p>
                        </div>
                    ) : (
                        files.map((file) => (
                            <div key={file.name} className="grid grid-cols-12 gap-4 p-3 items-center text-sm border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <div className="col-span-5 truncate font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span title={file.displayName}>{file.displayName}</span>
                                </div>
                                <div className="col-span-3">
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        file.state === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                            file.state === "PROCESSING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    )}>
                                        {file.state}
                                    </span>
                                </div>
                                <div className="col-span-3 text-muted-foreground text-xs">
                                    {new Date(file.createTime).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteFile(file.name)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
