import { PresenceRoster } from "@/components/PresenceRoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProject, useUpdateProjectName } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/utils";
import { GeminiSettingsModal } from "./GeminiSettingsModal";
/**
 * SketchForge — top app header.
 */
import { Check, Loader2, Redo2, Undo2, X, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function ThinkingIndicator() {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:0ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:160ms]" />
        <span className="size-1.5 rounded-full bg-primary animate-thinking-dot [animation-delay:320ms]" />
      </span>
      <span>Thinking…</span>
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

  const name = project?.name ?? "Untitled project";

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
          className="h-8 w-56 rounded-full border-dashed bg-card text-sm font-display"
          aria-label="Project name"
        />
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          onClick={commit}
          aria-label="Save project name"
        >
          <Check className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 rounded-full"
          onClick={cancel}
          aria-label="Cancel rename"
        >
          <X className="size-4" />
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
      className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-left transition-smooth hover:bg-card"
      title="Click to rename project"
    >
      <span className="font-display text-base font-semibold tracking-tight text-foreground">
        {name}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        edit
      </span>
    </button>
  );
}

interface HeaderProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** The export control rendered in the header (the Export HTML pill). */
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-dashed border-border/70 bg-card/60 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground shadow-glow">
          S
        </div>
        <ProjectNameEditor />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full border border-dashed border-border/70 hover:border-primary/50 text-muted-foreground hover:text-primary transition-smooth"
          onClick={() => setSettingsOpen(true)}
          title="Gemini AI Settings"
          aria-label="Gemini AI Settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {isGenerating && <ThinkingIndicator />}

        {/* Presence roster placeholder — avatar chips container */}
        <PresenceRoster />

        <div className="flex items-center gap-1.5 rounded-full border border-dashed border-border/70 bg-card p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              "disabled:opacity-40",
            )}
            aria-label="Undo"
            title="Undo"
            data-ocid="header.undo_button"
          >
            <Undo2 className="size-4" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium",
              "disabled:opacity-40",
            )}
            aria-label="Redo"
            title="Redo"
            data-ocid="header.redo_button"
          >
            <Redo2 className="size-4" />
            <span className="hidden sm:inline">Redo</span>
          </Button>
        </div>

        {/* Export HTML — standalone HTML export (no React/JSX per scope) */}
        {exportButton}

        {isGenerating && (
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
        )}
      </div>

      <GeminiSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

export default Header;
