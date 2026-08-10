import { useState, useEffect } from "react";
import { Sliders, Code2, ShieldCheck, Download, Sparkles, Check, FileText, Upload, GitCompare, FileCode, Layers } from "lucide-react";
import { extractModularProjectBundle, lintHtmlCode, importProjectPackage, calculateCodeDiff, generateBemCss, type LintReport, type ProjectBundle, type CodeDiffLine } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface VisualPropertyInspectorProps {
  html: string;
  onUpdateHtml: (newHtml: string) => void;
}

export function VisualPropertyInspector({ html, onUpdateHtml }: VisualPropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<"inspector" | "diff" | "import" | "bundle" | "lint">("inspector");

  // Visual Inspector State
  const [primaryColor, setPrimaryColor] = useState("#6d28d9");
  const [bgColor, setBgColor] = useState("#0f101d");
  const [fontSize, setFontSize] = useState("14");
  const [borderRadius, setBorderRadius] = useState("12");

  // Visual Diff State
  const [diffOriginal, setDiffOriginal] = useState(html);
  const [diffLines, setDiffLines] = useState<CodeDiffLine[]>([]);

  // Bidirectional Import State
  const [importJsonInput, setImportJsonInput] = useState("");
  const [importError, setImportError] = useState("");

  // Lint Report & Project Bundle
  const [lintReport, setLintReport] = useState<LintReport>(lintHtmlCode(html));
  const [bundle, setBundle] = useState<ProjectBundle>(extractModularProjectBundle(html));
  const [selectedFile, setSelectedFile] = useState<keyof ProjectBundle>("index.html");

  useEffect(() => {
    setLintReport(lintHtmlCode(html));
    setBundle(extractModularProjectBundle(html));
    setDiffLines(calculateCodeDiff(diffOriginal, html));
  }, [html, diffOriginal]);

  function applyVisualTheme() {
    let updated = html;
    updated = updated.replace(/bg-violet-600|bg-indigo-600|bg-primary/g, `bg-[${primaryColor}]`);
    updated = updated.replace(/text-sm/g, `text-[${fontSize}px]`);
    onUpdateHtml(updated);
    alert("Visual BEM & custom property overrides applied!");
  }

  function handlePackageImport() {
    setImportError("");
    try {
      const importedHtml = importProjectPackage(importJsonInput);
      onUpdateHtml(importedHtml);
      setImportJsonInput("");
      alert("Package imported & synced to canvas node successfully!");
    } catch (err: any) {
      setImportError(err.message || "Failed to import package.");
    }
  }

  function downloadProjectBundle() {
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sketchforge-project-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0e1b] text-white font-sans text-xs select-text">
      {/* Top Navigation Tabs */}
      <div className="flex justify-between items-center bg-[#070812] px-3 py-2 border-b border-white/10 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <Sliders className="size-4" />
          MAINTAINABILITY STUDIO
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar max-w-[320px]">
          <button
            type="button"
            onClick={() => setActiveTab("inspector")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[9px] transition-all shrink-0",
              activeTab === "inspector" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Sliders className="size-3" />
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("diff")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[9px] transition-all shrink-0",
              activeTab === "diff" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <GitCompare className="size-3" />
            Visual Diff
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[9px] transition-all shrink-0",
              activeTab === "import" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Upload className="size-3" />
            Import Package
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bundle")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[9px] transition-all shrink-0",
              activeTab === "bundle" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Code2 className="size-3" />
            Multi-File Bundle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lint")}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-[9px] transition-all shrink-0",
              activeTab === "lint" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <ShieldCheck className="size-3" />
            Lint ({lintReport.score}%)
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Editor */}
      {activeTab === "inspector" && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          <div className="bg-[#141528] p-3 rounded-xl border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" /> BEM CSS & Property Inspector
            </h4>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <label className="text-white/50 block mb-1">Primary Color (--sf-primary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="size-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-white/80">{primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="text-white/50 block mb-1">Canvas Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="size-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-white/80">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="text-white/50 block mb-1">Font Base Size (px)</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-white/50 block mb-1">Border Radius (--sf-radius-lg)</label>
                <input
                  type="number"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={applyVisualTheme}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-glow transition-all"
            >
              <Sparkles className="size-3.5" />
              Apply BEM & CSS Property Overrides
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Side-by-Side Code Diff */}
      {activeTab === "diff" && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex justify-between items-center mb-2 font-sans text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <GitCompare className="size-3.5" /> Visual Node Code Diff (Additions & Removals)
            </span>
            <button
              type="button"
              onClick={() => setDiffOriginal(html)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-2.5 py-0.5 rounded text-[10px]"
            >
              Set Current as Base
            </button>
          </div>

          <div className="flex-1 bg-black/50 p-2.5 rounded border border-white/10 overflow-y-auto font-mono text-[10px] space-y-0.5">
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  "px-2 py-0.5 rounded flex gap-3 whitespace-pre",
                  line.type === "added"
                    ? "bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500"
                    : line.type === "removed"
                    ? "bg-destructive/20 text-destructive border-l-2 border-destructive"
                    : "text-white/60"
                )}
              >
                <span className="w-6 text-right select-none opacity-40">{line.lineNumberNew || line.lineNumberOld || ""}</span>
                <span className="select-none">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
                <span>{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bidirectional Package Import (POST /builder/maintain/import) */}
      {activeTab === "import" && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
          <div className="bg-[#141528] p-3 rounded-xl border border-white/10 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Upload className="size-3.5 text-primary" /> Bidirectional Package Import (`POST /builder/maintain/import`)
            </h4>
            <p className="text-[10px] text-white/60">
              Paste or upload an exported `sketchforge-project-bundle.json` package to sync external edits back into canvas nodes.
            </p>

            <textarea
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              placeholder="Paste JSON project bundle content here..."
              className="w-full h-36 bg-black/40 border border-white/20 rounded p-2.5 text-emerald-300 font-mono text-[10px] outline-none resize-none"
            />

            {importError && <p className="text-[10px] text-destructive font-semibold">{importError}</p>}

            <button
              type="button"
              onClick={handlePackageImport}
              disabled={!importJsonInput.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-glow transition-all disabled:opacity-50"
            >
              <Upload className="size-3.5" />
              Import Package to Canvas Node
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Multi-File Bundle */}
      {activeTab === "bundle" && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          <div className="flex justify-between items-center mb-2 font-sans text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <FileText className="size-3.5" /> Multi-File Code Structure
            </span>
            <button
              type="button"
              onClick={downloadProjectBundle}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center gap-1 shadow-glow transition-all"
            >
              <Download className="size-3" />
              Download Full Project Package
            </button>
          </div>

          <div className="flex gap-1 border-b border-white/10 pb-1.5 mb-2 overflow-x-auto no-scrollbar">
            {(Object.keys(bundle) as Array<keyof ProjectBundle>).map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={cn(
                  "px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all shrink-0",
                  selectedFile === file ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
                )}
              >
                {file}
              </button>
            ))}
          </div>

          <textarea
            value={typeof bundle[selectedFile] === "string" ? (bundle[selectedFile] as string) : JSON.stringify(bundle[selectedFile], null, 2)}
            readOnly
            className="flex-1 w-full bg-black/50 text-emerald-300 p-2.5 rounded border border-white/10 outline-none font-mono text-[11px] leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Tab 5: Maintainability Lint Report */}
      {activeTab === "lint" && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
          <div className="bg-[#141528] p-3 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/50 font-bold">MAINTAINABILITY SCORE</div>
              <div className="text-2xl font-black font-display text-emerald-400">{lintReport.score} / 100</div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
              <ShieldCheck className="size-6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualPropertyInspector;
