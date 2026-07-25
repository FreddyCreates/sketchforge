import { useState, useEffect } from "react";
import { Sliders, Code2, ShieldCheck, Download, Sparkles, Check, Layers, AlertCircle, FileText } from "lucide-react";
import { extractModularProjectBundle, lintHtmlCode, type LintReport, type ProjectBundle } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface VisualPropertyInspectorProps {
  html: string;
  onUpdateHtml: (newHtml: string) => void;
}

export function VisualPropertyInspector({ html, onUpdateHtml }: VisualPropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<"inspector" | "bundle" | "lint">("inspector");

  // Visual Inspector State
  const [primaryColor, setPrimaryColor] = useState("#6d28d9");
  const [bgColor, setBgColor] = useState("#0f101d");
  const [fontSize, setFontSize] = useState("14");
  const [borderRadius, setBorderRadius] = useState("12");

  // Lint Report & Project Bundle
  const [lintReport, setLintReport] = useState<LintReport>(lintHtmlCode(html));
  const [bundle, setBundle] = useState<ProjectBundle>(extractModularProjectBundle(html));
  const [selectedFile, setSelectedFile] = useState<keyof ProjectBundle>("index.html");

  useEffect(() => {
    setLintReport(lintHtmlCode(html));
    setBundle(extractModularProjectBundle(html));
  }, [html]);

  function applyVisualTheme() {
    let updated = html;
    // Apply primary color override
    updated = updated.replace(/bg-violet-600|bg-indigo-600|bg-primary/g, `bg-[${primaryColor}]`);
    // Apply font size adjustment
    updated = updated.replace(/text-sm/g, `text-[${fontSize}px]`);
    onUpdateHtml(updated);
    alert("Visual style changes applied to card layout!");
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
      {/* Inspector Top Bar */}
      <div className="flex justify-between items-center bg-[#070812] px-3 py-2 border-b border-white/10 text-[10px]">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <Sliders className="size-4" />
          POST-GENERATION STUDIO
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("inspector")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
              activeTab === "inspector" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Sliders className="size-3" />
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bundle")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
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
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
              activeTab === "lint" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <ShieldCheck className="size-3" />
            Lint ({lintReport.score}%)
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Editor & Property Inspector */}
      {activeTab === "inspector" && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4">
          <div className="bg-[#141528] p-3 rounded-xl border border-white/10 space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sliders className="size-3.5 text-primary" /> Visual Property Inspector
            </h4>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <label className="text-white/50 block mb-1">Primary Color</label>
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
                <label className="text-white/50 block mb-1">Border Radius (px)</label>
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
              Apply Visual Property Overrides
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Modular Multi-File Project Bundle */}
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
            value={bundle[selectedFile]}
            readOnly
            className="flex-1 w-full bg-black/50 text-emerald-300 p-2.5 rounded border border-white/10 outline-none font-mono text-[11px] leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Tab 3: Automated Maintainability Lint Report */}
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

          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-white text-xs">Passed Quality Checks:</h5>
            {lintReport.passedChecks.map((chk, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-300 text-[11px]">
                <Check className="size-3.5 text-emerald-400 shrink-0" />
                <span>{chk}</span>
              </div>
            ))}

            {lintReport.issues.length > 0 && (
              <>
                <h5 className="font-bold text-white text-xs mt-3">Improvement Suggestions:</h5>
                {lintReport.issues.map((iss, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-amber-300 text-[11px]">
                    <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
                    <span>{iss}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualPropertyInspector;
