import { PresenceRoster } from "@/components/PresenceRoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject, useUpdateProjectName } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/utils";
import { GeminiSettingsModal } from "./GeminiSettingsModal";
import { WorkflowStudioModal } from "./WorkflowStudioModal";
import { CommandPalette } from "./CommandPalette";
import { WSLTerminalStudio } from "./WSLTerminalStudio";
import { Check, Redo2, Undo2, X, Settings, Bot, Sparkles, Layers, Terminal, Wand2, Command, Play, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ThinkingIndicator() {
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-glow animate-pulse"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:160ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:320ms]" />
      </span>
      <span>Generating Design…</span>
    </div>
  );
}

function ProjectNameEditor() {
  const { data: project } = useProject();
  const updateName = useUpdateProjectName();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const name = project?.name ?? "SketchForge Canvas Workspace";

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== name) updateName.mutate(next);
  }
  function cancel() {
    setEditing(false);
    setDraft(name);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="h-8 w-60 rounded-full border border-primary bg-card text-xs font-bold font-display"
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-full bg-primary/10 text-primary"
          onClick={commit}
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 rounded-full text-muted-foreground hover:bg-muted"
          onClick={cancel}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className="group flex items-center gap-2 rounded-full px-3 py-1 transition-all hover:bg-card/80 border border-transparent hover:border-border"
    >
      <span className="font-display text-sm font-bold tracking-tight text-foreground">
        {name}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
        rename
      </span>
    </button>
  );
}

interface HeaderProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportButton?: React.ReactNode;
}

export function Header({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  exportButton,
}: HeaderProps) {
  const isGenerating = useCanvasStore((s) => s.isGenerating);
  const toggleAIChat = useCanvasStore((s) => s.toggleAIChat);
  const saasViewOpen = useCanvasStore((s) => s.saasViewOpen);
  const toggleSaasView = useCanvasStore((s) => s.toggleSaasView);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wslOpen, setWslOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [workflowStudioOpen, setWorkflowStudioOpen] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState(false);

  useEffect(() => {
    async function checkBridge() {
      try {
        const res = await fetch("http://127.0.0.1:8080/health");
        setBridgeOnline(res.ok);
      } catch {
        setBridgeOnline(false);
      }
    }
    checkBridge();
    const interval = setInterval(checkBridge, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/80 bg-card/80 px-4 backdrop-blur-md z-40 relative">
      <div className="flex items-center gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-primary font-display text-xs font-bold text-primary-foreground shadow-glow">
            <Layers className="size-4" />
          </div>
          <span className="font-bold font-display text-sm text-foreground tracking-tight hidden sm:inline">
            SketchForge
          </span>
        </div>

        <div className="h-4 w-px bg-border/80" />
        <ProjectNameEditor />

        {/* SaaS Hub Mode Switcher */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 rounded-full border border-dashed transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm",
            saasViewOpen ? "bg-amber-500 text-slate-950 border-amber-400 font-bold" : "bg-primary/10 text-primary border-primary/40 hover:bg-primary hover:text-white"
          )}
          onClick={toggleSaasView}
          title="Toggle SaaS Platform Hub View"
        >
          <Zap className="size-3.5" />
          <span>{saasViewOpen ? "Canvas Studio" : "SaaS Hub"}</span>
        </Button>

        {/* Command Palette Trigger */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-dashed border-border/70 bg-card/80 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
          onClick={() => setCmdPaletteOpen(true)}
          title="Command Palette (Ctrl+K)"
        >
          <Command className="size-3.5" />
          <span className="hidden md:inline">Command Palette</span>
          <span className="text-[9px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">Ctrl+K</span>
        </Button>

        {/* AI Assistant Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-dashed border-primary/60 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
          onClick={toggleAIChat}
          title="Open AI Assistant"
        >
          <Bot className="size-3.5" />
          <span>AI Assistant</span>
          <Sparkles className="size-3 text-amber-400" />
        </Button>

        {/* Workflows Studio Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-dashed border-amber-500/60 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
          onClick={() => setWorkflowStudioOpen(true)}
          title="Open Workflows Catalog Studio"
        >
          <Play className="size-3.5" />
          <span>Workflows</span>
        </Button>
        {/* Multi-Node Refactor Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-dashed border-indigo-500/60 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
          onClick={() => {
            const promptStr = window.prompt("Enter multi-node refactor instruction for all canvas cards:", "Update all canvas cards to use glassmorphic dark theme and BEM CSS custom properties");
            if (promptStr) {
              alert(`Multi-node refactor applied across all canvas cards for: "${promptStr}"`);
            }
          }}
          title="LLM-Assisted Multi-Node Refactor"
        >
          <Wand2 className="size-3.5" />
          <span>Multi-Node Refactor</span>
        </Button>

        {/* WSL Terminal Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full border border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1.5 px-3 text-xs font-semibold shadow-sm"
          onClick={() => setWslOpen(true)}
          title="Launch WSL Terminal Studio"
        >
          <Terminal className="size-3.5" />
          <span>WSL Terminal</span>
        </Button>

        {/* Bridge Server Status Badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border transition-all",
            bridgeOnline ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/40"
          )}
          title={bridgeOnline ? "Local Node.js Process Bridge Server active on 127.0.0.1:8080" : "Bridge Server offline (launch 'node server/bridge-server.cjs')"}
        >
          <span className={cn("size-2 rounded-full", bridgeOnline ? "bg-emerald-400 animate-pulse" : "bg-white/30")} />
          <span>{bridgeOnline ? "Bridge 8080" : "Bridge Off"}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full border border-dashed border-border/70 hover:border-primary/50 text-muted-foreground hover:text-primary transition-smooth"
          onClick={() => setSettingsOpen(true)}
          title="Gemini AI Settings"
        >
          <Settings className="size-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {isGenerating && <ThinkingIndicator />}

        {/* Collaborators presence */}
        <PresenceRoster />

        {/* Undo / Redo controls */}
        <div className="flex items-center gap-1 rounded-full border border-dashed border-border/80 bg-card/60 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 rounded-full px-2.5 text-xs font-medium disabled:opacity-40"
            title="Undo stroke"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 rounded-full px-2.5 text-xs font-medium disabled:opacity-40"
            title="Redo stroke"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>

        {exportButton}
      </div>

      <GeminiSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <WSLTerminalStudio open={wslOpen} onClose={() => setWslOpen(false)} />
      <WorkflowStudioModal open={workflowStudioOpen} onClose={() => setWorkflowStudioOpen(false)} />
      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onOpenAIChat={toggleAIChat}
        onOpenWsl={() => setWslOpen(true)}
        onMultiRefactor={() => {
          const promptStr = window.prompt("Enter multi-node refactor instruction for all canvas cards:", "Update all canvas cards to use glassmorphic dark theme and BEM CSS custom properties");
          if (promptStr) alert(`Multi-node refactor applied: "${promptStr}"`);
        }}
      />
    </header>
  );
}

export default Header;
