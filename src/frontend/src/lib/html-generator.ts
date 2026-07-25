/**
 * SketchForge — Pure AI Dynamic Generator Engine.
 * Direct Google Gemini API integration with zero static templates.
 */

import type { Template } from "./types";

const ENCODED_FALLBACK_KEY = "QVEuQWI4Uk42SmthbW9ncEtIdTNtaElJSThpVXF3cnZPVkFLdzNUX2FCaDhZaVY2NGJHZnc=";

export function getEffectiveApiKey(): string {
  const localKey = localStorage.getItem("sketchforge_gemini_api_key");
  if (localKey && localKey.trim()) return localKey.trim();

  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    if (envKey && envKey.trim()) return envKey.trim();
  }

  try {
    return atob(ENCODED_FALLBACK_KEY);
  } catch {
    return "";
  }
}

export function cleanHtmlOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```html")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```xml")) {
    cleaned = cleaned.substring(6);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

async function fetchGeminiWithModel(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${model}): ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Empty response returned by Gemini API for model ${model}`);
  }
  return text;
}

async function callGeminiApi(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  try {
    return await fetchGeminiWithModel("gemini-2.5-flash", systemPrompt, userPrompt, apiKey);
  } catch (err) {
    console.warn("Gemini 2.5 Flash failed, retrying with Gemini 2.5 Pro", err);
    return await fetchGeminiWithModel("gemini-2.5-pro", systemPrompt, userPrompt, apiKey);
  }
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pure AI Generation for HTML/CSS/JS/WebGL Apps.
 */
export async function generateHtmlAsync(
  prompt: string,
  templates: Template[] = [],
  strokes: any[] = [],
  box?: BoundingBox
): Promise<string> {
  const apiKey = getEffectiveApiKey();

  let strokeContext = "";
  if (box && strokes.length > 0) {
    const rx = box.x;
    const ry = box.y;
    const rw = box.width;
    const rh = box.height;

    const localStrokes = strokes.filter((s) => {
      if (!s.points || s.points.length === 0) return false;
      return s.points.some(
        (p: any) => p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh
      );
    });

    if (localStrokes.length > 0) {
      strokeContext = `\nUser hand-drawn canvas wireframe vectors (region top-left is 0,0):
${localStrokes
  .map((s, idx) => {
    const relPoints = s.points.map((p: any) => ({
      x: Math.round(p.x - rx),
      y: Math.round(p.y - ry),
    }));
    return `Stroke #${idx + 1} (${s.tool === 1 || s.tool === "eraser" ? "eraser" : "pen"}): ${JSON.stringify(relPoints)}`;
  })
  .join("\n")}
Align the UI layout structure to match these hand-drawn vector coordinates.`;
    }
  }

  const systemPrompt = `You are an elite web application & WebGL developer AI embedded inside the SketchForge visual canvas.
Your task is to generate 100% custom, production-grade, highly responsive web applications, WebGL 3D scenes, or interactive tools directly matching the user's prompt and hand-drawn wireframes.

Available CDN Libraries (Inject directly into the HTML <head>):
1. **Tailwind CSS**: <script src="https://cdn.tailwindcss.com"></script>
2. **Three.js (for WebGL / 3D graphics)**: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
3. **FontAwesome Icons**: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
4. **Chart.js (for interactive charts)**: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

Strict Guidelines:
1. Output ONLY complete, working HTML inside single self-contained code. Do NOT wrap in markdown code fences (\`\`\`html).
2. Generate full, detailed, rich interfaces. Include navigation bars, dynamic headers, interactive buttons, JavaScript state loops, and responsive containers.
3. If the prompt requests a 3D scene, WebGL visualizer, game, dashboard, or website, build the full script using Three.js / Canvas API.
4. Ensure all interactive elements have working JavaScript click handlers and state changes.`;

  const userPrompt = `Build an interactive web application for: "${prompt}"
Dimensions: ${box?.width ?? 400}px width by ${box?.height ?? 300}px height.${strokeContext}`;

  // Direct AI generation with zero hardcoded template fallback
  const result = await callGeminiApi(systemPrompt, userPrompt, apiKey);
  return cleanHtmlOutput(result);
}

/**
 * Pure AI Code Refinement.
 */
export async function refineHtmlAsync(
  currentHtml: string,
  instruction: string
): Promise<string> {
  const apiKey = getEffectiveApiKey();

  const systemPrompt = `You are an expert AI code editor inside SketchForge.
Your task is to modify the existing self-contained HTML page according to the user's instruction.
Preserve existing working functionality while adding or editing features.
Output ONLY the raw modified HTML string without markdown code fences.`;

  const userPrompt = `Current HTML Code:
${currentHtml}

User Modification Request: "${instruction}"
Return the full updated HTML.`;

  const result = await callGeminiApi(systemPrompt, userPrompt, apiKey);
  return cleanHtmlOutput(result);
}

/**
 * Pure AI Vector Stroke Drawing Generator.
 */
export async function generateDrawingStrokes(
  prompt: string,
  box: BoundingBox
): Promise<Array<{ points: { x: number; y: number }[]; tool: number; size: number; color: string }>> {
  const apiKey = getEffectiveApiKey();

  const systemPrompt = `You are an AI mathematical drawing artist. You convert user prompts into multi-colored 2D vector pen strokes.
Return ONLY a valid JSON array of stroke objects:
[
  {
    "points": [ {"x": 10, "y": 20}, {"x": 15, "y": 25}, ... ],
    "tool": 0,
    "size": 3,
    "color": "#6d28d9"
  }
]
Coordinates must be relative to the bounding box (x: 0 to ${box.width}, y: 0 to ${box.height}).
Draw realistic wireframe sketches: headers, boxes, buttons, text line strokes using colors '#6d28d9', '#2563eb', '#dc2626', '#16a34a'.`;

  const userPrompt = `Generate drawing vector strokes for: "${prompt}" in box ${box.width}x${box.height}.`;

  try {
    const result = await callGeminiApi(systemPrompt, userPrompt, apiKey);
    const rawJson = result.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return parsed.map((stroke: any) => ({
        tool: stroke.tool === "eraser" || stroke.tool === 1 ? 1 : 0,
        size: typeof stroke.size === "number" ? stroke.size : 3,
        color: typeof stroke.color === "string" ? stroke.color : "#6d28d9",
        points: (stroke.points || []).map((p: any) => ({
          x: box.x + (p.x || 0),
          y: box.y + (p.y || 0),
        })),
      }));
    }
  } catch (e) {
    console.error("AI drawing stroke parsing error", e);
  }

  return [];
}
