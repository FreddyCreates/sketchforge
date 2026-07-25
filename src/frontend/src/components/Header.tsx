import { PresenceRoster } from "@/components/PresenceRoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject, useUpdateProjectName } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/utils";
import { GeminiSettingsModal } from "./GeminiSettingsModal";
import { WSLTerminalStudio } from "./WSLTerminalStudio";
import { Check, Redo2, Undo2, X, Settings, Bot, Sparkles, Layers, Terminal } from "lucide-react";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wslOpen, setWslOpen] = useState(false);

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
    </header>
  );
}

export default Header;
