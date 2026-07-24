import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KeyRound, ExternalLink, Check, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface GeminiSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recommended)" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
];

export function GeminiSettingsModal({
  open,
  onOpenChange,
}: GeminiSettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (open) {
      const storedKey = localStorage.getItem("sketchforge_gemini_api_key") || "";
      const storedModel = localStorage.getItem("sketchforge_gemini_model") || "gemini-2.5-flash";
      setApiKey(storedKey);
      setModel(storedModel);
      setSaved(false);
    }
  }, [open]);

  function handleSave() {
    localStorage.setItem("sketchforge_gemini_api_key", apiKey.trim());
    localStorage.setItem("sketchforge_gemini_model", model);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onOpenChange(false);
    }, 1000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sketch-border bg-card shadow-glow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg text-primary">
            <KeyRound className="size-5" />
            <span>Gemini AI Engine Settings</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Provide a Google Gemini API Key to enable live, responsive AI app generation and sketching.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-3">
          {/* Key Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gemini API Key
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="pr-10 rounded-xl border-dashed focus-visible:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Model Version
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input border-dashed bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline self-start"
          >
            <span>Get a free Gemini API Key from Google AI Studio</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="flex justify-end gap-2 border-t border-dashed border-border/70 pt-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="glow-primary rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground px-5"
          >
            {saved ? (
              <span className="flex items-center gap-1">
                <Check className="size-3.5" />
                Saved!
              </span>
            ) : (
              "Save & Apply"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
