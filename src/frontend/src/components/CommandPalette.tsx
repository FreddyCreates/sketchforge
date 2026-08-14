import { useState, useEffect } from "react";
import { Search, Command, Bot, Terminal, Code, Sliders, ShieldCheck, Download, Wand2, Layers, Cpu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  category: "AI & Generation" | "Compilers & IDE" | "Sandboxes & Terminal" | "Export & Maintainability";
  icon: any;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenAIChat: () => void;
  onOpenWsl: () => void;
  onMultiRefactor: () => void;
}

export function CommandPalette({ open, onClose, onOpenAIChat, onOpenWsl, onMultiRefactor }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          // Open triggered by parent state
        }
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const commands: CommandItem[] = [
    {
      id: "ai-chat",
      label: "Open SketchForge AI Assistant",
      category: "AI & Generation",
      icon: Bot,
      action: () => {
        onOpenAIChat();
        onClose();
      },
    },
    {
      id: "multi-refactor",
      label: "LLM-Assisted Multi-Node Refactor",
      category: "AI & Generation",
      icon: Wand2,
      action: () => {
        onMultiRefactor();
        onClose();
      },
    },
    {
      id: "wsl-terminal",
      label: "Launch WSL Ultimate Terminal Studio",
      category: "Sandboxes & Terminal",
      icon: Terminal,
      action: () => {
        onOpenWsl();
        onClose();
      },
    },
    {
      id: "ide-monaco",
      label: "Open Monaco IDE Code Studio",
      category: "Compilers & IDE",
      icon: Code,
      action: () => {
        alert("Select any card on the canvas to open the Monaco IDE Studio.");
        onClose();
      },
    },
    {
      id: "inspect-bem",
      label: "Open Visual BEM Property Inspector",
      category: "Export & Maintainability",
      icon: Sliders,
      action: () => {
        alert("Select a card and switch to the INSPECT tab to adjust visual BEM CSS custom properties.");
        onClose();
      },
    },
  ];

  const filtered = commands.filter((c) =>
    `${c.label} ${c.category}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md pt-20 p-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-xl rounded-2xl border border-dashed border-primary/50 bg-[#0d0e1b] text-white shadow-glow flex flex-col overflow-hidden font-sans">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 bg-[#070812]">
          <Search className="size-4 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tools (Ctrl+K)..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            autoFocus
          />
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/50 border border-white/10">
            ESC to close
          </span>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-xs">No matching commands found.</div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/20 hover:text-white transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-primary-foreground">{cmd.label}</div>
                      <div className="text-[10px] text-white/40">{cmd.category}</div>
                    </div>
                  </div>
                  <Command className="size-3.5 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
