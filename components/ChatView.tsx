import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, User, Bot, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChatViewProps {
    store: any;
    apiKey: string;
}

interface Message {
    role: "user" | "model";
    content: string;
    citations?: any[];
}

export function ChatView({ store, apiKey }: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (apiKey) headers["x-gemini-api-key"] = apiKey;

            const res = await fetch("/api/chat", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
                    storeId: store.name,
                }),
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const botMessage: Message = {
                role: "model",
                content: data.response,
                citations: data.citations,
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to send message: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto">
            <div className="flex-1 overflow-auto p-4 space-y-6" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Bot className="h-12 w-12 mb-4" />
                        <p>Start chatting with {store.displayName}</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-4",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className={msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>

                        <div className={cn(
                            "flex flex-col max-w-[80%]",
                            msg.role === "user" ? "items-end" : "items-start"
                        )}>
                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                {msg.content}
                            </div>

                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                    <p className="font-semibold">Sources:</p>
                                    {msg.citations.map((citation, idx) => (
                                        <div key={idx} className="bg-muted/50 p-2 rounded border border-border">
                                            <p className="line-clamp-2 italic">"{citation.content}"</p>
                                            <p className="mt-1 text-[10px] opacity-70">
                                                {citation.uri ? (
                                                    <a href={citation.uri} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {citation.title || citation.uri}
                                                    </a>
                                                ) : (
                                                    <span>{citation.title || "Unknown Source"}</span>
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-muted"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-background">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your files..."
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !input.trim()}>
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
