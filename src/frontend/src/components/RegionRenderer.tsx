/**
 * SketchForge — safe HTML renderer for generated regions.
 *
 * Renders the AI-generated HTML inside a sandboxed iframe using
 * `srcdoc`. The sandbox allows scripts (so interactive output like
 * buttons/forms work) but blocks top-navigation, same-origin access,
 * and popups — keeping the generated content isolated from the app.
 *
 * If the generated content is a fragment (no <html> wrapper), we wrap
 * it with a minimal scaffolding so it renders consistently.
 */
import { useEffect, useRef, useState } from "react";

interface RegionRendererProps {
  html: string;
}

function ensureDocument(html: string): string {
  const trimmed = html.trim();
  if (/<!doctype|<html/i.test(trimmed)) return trimmed;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%}</style></head><body>${trimmed}</body></html>`;
}

export function RegionRenderer({ html }: RegionRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState(() => ensureDocument(html));

  // Re-derive the document when the html prop changes (e.g. regenerate).
  useEffect(() => {
    setDoc(ensureDocument(html));
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Generated region preview"
      srcDoc={doc}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-scripts allow-forms allow-popups-to-escape-sandbox"
      // No `allow-same-origin` → the iframe is fully origin-isolated.
      style={{ pointerEvents: "auto" }}
      data-ocid="canvas.region.renderer"
    />
  );
}

export default RegionRenderer;
