/**
 * SketchForge — standalone HTML export.
 *
 * Assembles a complete, self-contained HTML document from a single tab's
 * canvas state: strokes (as SVG paths), generated regions (as positioned
 * rendered HTML), and comments (as positioned markers with reply threads).
 *
 * The output is fully offline-viewable — no external dependencies. The
 * sketchy aesthetic (dashed borders, warm paper background, purple
 * accents, pill buttons, the rough-paper turbulence filter) is inlined
 * as a <style> block so the exported file looks like the live canvas.
 *
 * Per the build scope, this exports a STANDALONE HTML document only —
 * no React/JSX component export is produced.
 */
import type { Comment, GeneratedRegion, Point, Stroke, Tab } from "@/lib/types";

// --- Helpers ---------------------------------------------------------------

/**
 * Escape a string for safe interpolation inside HTML text content or
 * attribute values. We escape the five significant characters plus the
 * backtick (defensive) — sufficient for innerHTML/attribute contexts.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape a string for safe interpolation inside a <style> or <script>
 * block. Closes the block early on `</` sequences to prevent breakout.
 */
function escapeStyle(s: string): string {
  return s.replace(/<\/(style|script)/gi, "<\\/$1");
}

/**
 * Build an SVG path `d` string from a list of points using smooth
 * quadratic curves through midpoints — mirrors DrawingCanvas's
 * `pathFromPoints` so the exported strokes match the live render.
 */
function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Format a backend Timestamp (nanos since epoch) as a readable string. */
function formatTimestamp(ts: bigint): string {
  const ms = Number(ts);
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Sanitize a string for use in a filename (download attribute). */
function safeFileName(s: string): string {
  return (
    s
      .trim()
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "untitled"
  );
}

// --- Layer builders --------------------------------------------------------

/**
 * Compute a generous SVG viewBox covering all stroke points plus padding.
 * Mirrors DrawingCanvas's viewBox logic.
 */
function computeViewBox(strokes: Stroke[]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const all: Point[] = strokes.flatMap((s) => s.points);
  if (all.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const pad = 40;
  return {
    x: minX - pad,
    y: minY - pad,
    w: Math.max(maxX - minX + pad * 2, 1),
    h: Math.max(maxY - minY + pad * 2, 1),
  };
}

/** Build the inline SVG layer containing all strokes. */
function buildStrokesSvg(strokes: Stroke[]): string {
  const vb = computeViewBox(strokes);
  const paths = strokes
    .map((s) => {
      const isEraser = s.tool === "eraser";
      const color = isEraser ? "#f7f3e8" : s.color;
      const width = isEraser ? Math.max(s.size, 12) : s.size;
      const d = pathFromPoints(s.points);
      return `      <path d="${d}" stroke="${escapeHtml(color)}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("\n");

  return `    <svg
      class="strokes-layer"
      viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"
      preserveAspectRatio="xMinYMin meet"
      aria-label="Drawing strokes"
      role="img"
    >
      <defs>
        <filter id="rough-paper" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>
      <g filter="url(#rough-paper)">
${paths}
      </g>
    </svg>`;
}

/**
 * Build the positioned HTML for a single generated region. The region's
 * `generatedHtml` is embedded inside a positioned frame. We wrap it in
 * a sandboxed iframe via srcdoc so the generated content is isolated
 * and self-contained (no external deps leak in or out).
 */
function buildRegionHtml(region: GeneratedRegion, index: number): string {
  const frameStyle =
    `left:${region.x}px;top:${region.y}px;` +
    `width:${region.width}px;height:${region.height}px;`;

  // If the region is still generating or errored, render a placeholder
  // matching the live canvas states.
  const status = region.status;
  let inner: string;
  if (status === "generating") {
    inner = `<div class="region-placeholder region-generating">
      <div class="thinking-dots"><span></span><span></span><span></span></div>
      <p>Thinking…</p>
    </div>`;
  } else if (status === "error") {
    inner = `<div class="region-placeholder region-error">
      <p>Generation failed</p>
    </div>`;
  } else if (region.generatedHtml?.trim()) {
    // Embed the generated HTML inside a sandboxed iframe via srcdoc.
    // The iframe is fully origin-isolated (no allow-same-origin) but
    // permits scripts and forms so interactive output still works.
    const trimmed = region.generatedHtml.trim();
    const isFullDoc = /<!doctype|<html/i.test(trimmed);
    const docContent = isFullDoc
      ? trimmed
      : `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%}</style></head><body>${trimmed}</body></html>`;
    // Escape for the srcdoc attribute (double-quote delimited).
    const srcdoc = escapeHtml(docContent);
    inner = `<iframe class="region-iframe" srcdoc="${srcdoc}" title="Generated region ${index + 1}" sandbox="allow-scripts allow-forms allow-popups-to-escape-sandbox"></iframe>`;
  } else {
    inner = `<div class="region-placeholder region-empty"><p>Empty region</p></div>`;
  }

  return `    <div class="region-frame" style="${frameStyle}" data-region-index="${index}">
      ${inner}
    </div>`;
}

/** Build the positioned marker for a single comment with its reply thread. */
function buildCommentHtml(comment: Comment, index: number): string {
  const pinStyle = `left:${comment.x}px;top:${comment.y - 14}px;`;
  const replies = comment.replies
    .map(
      (r) => `        <div class="reply">
          <p class="reply-author">${escapeHtml(r.author)}</p>
          <p class="reply-text">${escapeHtml(r.text)}</p>
          <p class="reply-time">${escapeHtml(formatTimestamp(r.createdAt))}</p>
        </div>`,
    )
    .join("\n");

  return `    <div class="comment" style="left:${comment.x}px;top:${comment.y}px;">
      <div class="comment-pin" style="${pinStyle}">
        <span class="pin-circle">${index + 1}</span>
        <span class="pin-tip"></span>
      </div>
      <div class="comment-card">
        <div class="comment-header">
          <p class="comment-author">${escapeHtml(comment.author)}</p>
          <p class="comment-time">${escapeHtml(formatTimestamp(comment.createdAt))}</p>
        </div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
${
  comment.replies.length > 0
    ? `        <div class="reply-thread">\n${replies}\n        </div>`
    : ""
}
      </div>
    </div>`;
}

// --- Inline CSS -----------------------------------------------------------

/**
 * The inline stylesheet for the exported document. Reproduces the
 * sketchy aesthetic from index.css: warm paper background, dashed
 * borders, purple accents, pill buttons, and the rough-paper turbulence
 * filter (applied to the strokes layer via SVG <filter>).
 */
const EXPORT_CSS = `
  :root {
    --paper: oklch(0.97 0.006 90);
    --ink: oklch(0.2 0.01 280);
    --primary: oklch(0.62 0.22 285);
    --primary-foreground: oklch(0.99 0.005 285);
    --card: #ffffff;
    --muted-foreground: oklch(0.5 0.01 280);
    --border: oklch(0.86 0.008 280);
    --destructive: oklch(0.55 0.22 25);
    --font-display: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
    --font-body: "DM Sans", "Segoe UI", system-ui, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background-color: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  .export-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    border-bottom: 1.5px dashed oklch(var(--ink) / 0.35);
    background-color: oklch(var(--card) / 0.6);
    backdrop-filter: blur(4px);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .export-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
  }
  .export-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .export-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.375rem 0.875rem;
    border-radius: 9999px;
    border: 1.5px solid oklch(var(--ink) / 0.35);
    background-color: var(--card);
    color: var(--ink);
    font-weight: 600;
    font-size: 0.8rem;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .export-pill:hover {
    border-color: oklch(var(--primary) / 0.6);
    color: var(--primary);
    box-shadow: 0 0 0 1px oklch(var(--primary) / 0.2);
  }
  .canvas-stage {
    position: relative;
    width: 100%;
    min-height: 80vh;
    overflow: hidden;
    background-color: var(--paper);
  }
  .canvas-layer {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .strokes-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .region-frame {
    position: absolute;
    border: 1.5px dashed oklch(var(--ink) / 0.55);
    border-radius: 14px;
    background-color: var(--card);
    overflow: hidden;
    box-shadow: 2px 3px 0 0 oklch(var(--ink) / 0.1);
  }
  .region-iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background-color: #fff;
  }
  .region-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }
  .region-generating { background-color: oklch(var(--card) / 0.6); }
  .region-error { color: var(--destructive); }
  .thinking-dots {
    display: flex;
    gap: 0.25rem;
  }
  .thinking-dots span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background-color: var(--primary);
    animation: thinking-dot 1.2s ease-in-out infinite;
  }
  .thinking-dots span:nth-child(2) { animation-delay: 0.16s; }
  .thinking-dots span:nth-child(3) { animation-delay: 0.32s; }
  @keyframes thinking-dot {
    0%, 100% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-2px); }
  }
  .comment {
    position: absolute;
  }
  .comment-pin {
    position: absolute;
    transform: translate(-50%, -100%);
    transform-origin: bottom center;
  }
  .pin-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 0.4rem;
    border-radius: 9999px;
    border: 1.5px dashed oklch(var(--ink) / 0.7);
    background-color: var(--card);
    color: var(--ink);
    font-size: 0.7rem;
    font-weight: 700;
    box-shadow: 0 1px 3px oklch(var(--ink) / 0.15);
  }
  .pin-tip {
    position: absolute;
    left: 50%;
    top: 100%;
    width: 0.5rem;
    height: 0.5rem;
    transform: translate(-50%, -50%) rotate(45deg);
    border-bottom: 1.5px dashed oklch(var(--ink) / 0.7);
    border-right: 1.5px dashed oklch(var(--ink) / 0.7);
    background-color: var(--card);
  }
  .comment-card {
    position: absolute;
    left: 18px;
    top: -24px;
    width: 18rem;
    border: 1.5px dashed oklch(var(--ink) / 0.55);
    border-radius: 14px;
    background-color: var(--card);
    padding: 0.75rem;
    box-shadow: 0 0 0 1px oklch(var(--primary) / 0.2), 0 4px 18px -2px oklch(var(--primary) / 0.25);
    z-index: 5;
  }
  .comment-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .comment-author {
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
  }
  .comment-time {
    font-size: 0.625rem;
    color: var(--muted-foreground);
    margin: 0;
  }
  .comment-text {
    font-size: 0.85rem;
    margin: 0 0 0.5rem;
  }
  .reply-thread {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-left: 1.5px dashed oklch(var(--border) / 0.7);
    padding-left: 0.5rem;
  }
  .reply-author {
    font-weight: 600;
    font-size: 0.75rem;
    margin: 0;
  }
  .reply-text {
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin: 0;
  }
  .reply-time {
    font-size: 0.625rem;
    color: oklch(var(--muted-foreground) / 0.7);
    margin: 0;
  }
  .export-footer {
    padding: 1rem 1.25rem;
    border-top: 1.5px dashed oklch(var(--ink) / 0.35);
    font-size: 0.7rem;
    color: var(--muted-foreground);
    text-align: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .thinking-dots span { animation: none; }
  }
`;

// --- Main assembler --------------------------------------------------------

/**
 * Assemble a complete standalone HTML document for a single tab.
 *
 * @param projectName  The project name (used in <title> and filename).
 * @param tab          The tab being exported.
 * @param strokes      All strokes on the tab.
 * @param regions      All generated regions on the tab.
 * @param comments     All comments (with replies) on the tab.
 * @returns            A self-contained HTML document string.
 */
export function exportTabAsHtml(
  projectName: string,
  tab: Tab,
  strokes: Stroke[],
  regions: GeneratedRegion[],
  comments: Comment[],
): string {
  const generatedAt = new Date().toISOString();
  const generatedAtLabel = new Date().toLocaleString();

  const strokesSvg = buildStrokesSvg(strokes);
  const regionsHtml = regions.map((r, i) => buildRegionHtml(r, i)).join("\n");
  const commentsHtml = comments
    .map((c, i) => buildCommentHtml(c, i))
    .join("\n");

  const title = `${projectName} — ${tab.name}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="generator" content="SketchForge" />
  <meta name="generated-at" content="${escapeHtml(generatedAt)}" />
  <title>${escapeHtml(title)}</title>
  <style>
${escapeStyle(EXPORT_CSS)}
  </style>
</head>
<body>
  <header class="export-header">
    <h1 class="export-title">${escapeHtml(title)}</h1>
    <div class="export-meta">
      <span>Exported ${escapeHtml(generatedAtLabel)}</span>
      <a class="export-pill" href="#" onclick="window.print();return false;" title="Print this page">
        Print
      </a>
    </div>
  </header>

  <main class="canvas-stage" role="img" aria-label="Exported canvas for ${escapeHtml(tab.name)}">
    <div class="canvas-layer">
${strokesSvg}
${regionsHtml}
${commentsHtml}
    </div>
  </main>

  <footer class="export-footer">
    Exported from SketchForge — ${escapeHtml(projectName)} / ${escapeHtml(tab.name)} — ${escapeHtml(generatedAtLabel)}
  </footer>
</body>
</html>`;
}

/**
 * Trigger a browser download of the exported HTML for the given tab.
 * The filename is `{projectName}-{tabName}.html` with unsafe characters
 * sanitized.
 */
export function downloadTabAsHtml(
  projectName: string,
  tab: Tab,
  strokes: Stroke[],
  regions: GeneratedRegion[],
  comments: Comment[],
): void {
  const html = exportTabAsHtml(projectName, tab, strokes, regions, comments);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(projectName)}-${safeFileName(tab.name)}.html`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
