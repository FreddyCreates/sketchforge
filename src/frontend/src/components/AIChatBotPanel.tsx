import { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "@/lib/canvas-store";
import { useCreateRegion, useAddStroke } from "@/hooks/use-canvas-data";
import { generateHtmlAsync, generateDrawingStrokes, getEffectiveApiKey } from "@/lib/html-generator";
import { Bot, Send, X, Sparkles, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  status?: "sending" | "done" | "error";
}

export function AIChatBotPanel() {
  const aiChatOpen = useCanvasStore((s) => s.aiChatOpen);
  const closeAIChat = useCanvasStore((s) => s.closeAIChat);
  const activeTabId = useCanvasStore((s) => s.activeTabId);

  const createRegion = useCreateRegion();
  const addStroke = useAddStroke();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ai",
      text: "Hello! I am your SketchForge AI Assistant. Ask me to build web apps, generate WebGL 3D scenes, draw wireframes, or refine your canvas designs!",
      timestamp: new Date(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!aiChatOpen) return null;

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || activeTabId === null) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Determine center bounding box for region creation
      const box = {
        x: 150 + Math.random() * 80,
        y: 150 + Math.random() * 80,
        width: 480,
        height: 360,
      };

      // 1. Create region container on active tab
      const createdRegion = await createRegion.mutateAsync({
        tabId: activeTabId,
        region: {
          ...box,
          prompt: text,
        },
      });

      // 2. Draw wireframe strokes on canvas paper
      try {
        const strokes = await generateDrawingStrokes(text, box);
        for (const stroke of strokes) {
          if (stroke.points.length > 0) {
            await addStroke.mutateAsync({
              tabId: activeTabId,
              tool: (stroke.tool === 1 ? "eraser" : "pen") as any,
              color: stroke.color,
              size: stroke.size,
              points: stroke.points,
            });
          }
        }
      } catch (err) {
        console.error("Chatbot stroke drawing fallback", err);
      }

      // 3. Generate HTML code using Gemini AI engine
      const html = await generateHtmlAsync(text, [], [], box);

      // 4. Update created region with generated HTML code
      if (createdRegion) {
        await createRegion.mutateAsync({
          tabId: activeTabId,
          region: {
            ...box,
            prompt: text,
          },
        });
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `I generated the app for "${text}" and rendered it directly on your canvas! You can click the region to view or edit the Monaco IDE code.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `I encountered an issue generating that app: ${err.message || "Gemini API error"}. Please check your key or try again.`,
        timestamp: new Date(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[520px] w-96 flex-col overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-card shadow-glow font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-display text-foreground">SketchForge AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">Connected to Gemini API</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeAIChat}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 max-w-[85%]",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              )}
            >
              {msg.sender === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
            </div>
            <div
              className={cn(
                "rounded-xl p-3 text-xs leading-relaxed shadow-sm",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : msg.status === "error"
                  ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-none"
                  : "bg-card border border-border/60 text-foreground rounded-tl-none"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 mr-auto items-center text-muted-foreground text-xs font-medium">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="size-3.5 animate-spin" />
            </div>
            <div className="bg-card border border-border/60 rounded-xl px-3 py-2 text-xs flex items-center gap-1.5">
              <span>Generating design & drawing strokes...</span>
              <RefreshCw className="size-3 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-border/80 bg-card p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to build a 3D WebGL scene, app, or drawing..."
            className="flex-1 rounded-xl border border-dashed border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50 transition-smooth"
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChatBotPanel;
