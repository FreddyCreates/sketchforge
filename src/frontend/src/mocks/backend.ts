/**
 * Mock backend for SketchForge visual QA.
 *
 * Returns realistic sample data so the full UI (header, tab bar, toolbar,
 * canvas with strokes/comments/regions) renders without a live canister.
 * State is held in-memory so mutations (add stroke, create tab, etc.) are
 * reflected during the session.
 */
import type { backendInterface } from "../backend";
import {
  RegionStatus,
  Tool,
  UserRole,
  type CommentInput,
  type CommentView,
  type GeneratedRegionView,
  type Point,
  type PresenceInput,
  type PresenceView,
  type ProjectView,
  type RegionInput,
  type RegionUpdate,
  type ReplyInput,
  type ReplyView,
  type Result,
  type RegionVersionView,
  type StrokeInput,
  type StrokeView,
  type TabView,
  type TemplateView,
} from "../backend";

const now = () => BigInt(Date.now());

let nextId = 100n;
const genId = () => nextId++;

const project: ProjectView = {
  id: 1n,
  name: "SketchForge Demo",
  createdAt: now(),
  updatedAt: now(),
};

const tabs: TabView[] = [
  {
    id: 10n,
    projectId: 1n,
    name: "Landing Page",
    order: 0n,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 11n,
    projectId: 1n,
    name: "Dashboard",
    order: 1n,
    createdAt: now(),
    updatedAt: now(),
  },
];

const strokesByTab = new Map<bigint, StrokeView[]>();
strokesByTab.set(10n, [
  {
    id: 1000n,
    tabId: 10n,
    createdAt: now(),
    color: "#1b1b2f",
    size: 3,
    tool: Tool.pen,
    points: [
      { x: 120, y: 140 },
      { x: 180, y: 200 },
      { x: 240, y: 180 },
      { x: 300, y: 240 },
    ],
  },
]);

const commentsByTab = new Map<bigint, CommentView[]>();
commentsByTab.set(10n, [
  {
    id: 2000n,
    tabId: 10n,
    x: 420,
    y: 160,
    author: "Avery",
    text: "Love the hero sketch — can we make the CTA pop more?",
    createdAt: now(),
    replies: [
      {
        createdAt: now(),
        author: "Jordan",
        text: "Agreed, bumping the glow on Generate.",
      } as ReplyView,
    ],
  },
]);

const regionsByTab = new Map<bigint, GeneratedRegionView[]>();
regionsByTab.set(10n, [
  {
    id: 3000n,
    tabId: 10n,
    x: 520,
    y: 320,
    width: 280,
    height: 180,
    status: RegionStatus.done,
    prompt: "A glowing purple CTA button labeled Get Started",
    generatedHtml:
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif"><button style="padding:14px 28px;border-radius:9999px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;font-weight:600;font-size:16px;box-shadow:0 0 28px -4px rgba(124,58,237,.6)">Get Started</button></div>',
    createdAt: now(),
    updatedAt: now(),
  },
]);

// --- Presence (live collaboration) ---
// Keyed by principal text so upserts overwrite the same collaborator.
const presenceByPrincipal = new Map<string, PresenceView>();
presenceByPrincipal.set("2c5a-7f3b-9e1d-4a8b", {
  principal: "2c5a-7f3b-9e1d-4a8b",
  displayName: "Avery",
  color: "oklch(0.62 0.22 285)",
  activeTabId: 10n,
  cursorX: 240,
  cursorY: 180,
  lastSeen: now(),
  activeTool: "pen",
});
presenceByPrincipal.set("8b1d-3c9f-2a7e-5d4c", {
  principal: "8b1d-3c9f-2a7e-5d4c",
  displayName: "Jordan",
  color: "oklch(0.7 0.17 45)",
  activeTabId: 10n,
  cursorX: 420,
  cursorY: 320,
  lastSeen: now(),
  activeTool: "select",
});

// --- Region version history ---
// Keyed by regionId; each entry is the list of prior versions for that region.
const versionsByRegion = new Map<bigint, RegionVersionView[]>();
versionsByRegion.set(3000n, [
  {
    versionId: 9001n,
    regionId: 3000n,
    createdAt: BigInt(Date.now() - 60_000),
    prompt: "A purple CTA button",
    generatedHtml:
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif"><button style="padding:12px 24px;border-radius:8px;background:#7c3aed;color:#fff;font-weight:600">Get Started</button></div>',
  },
  {
    versionId: 9002n,
    regionId: 3000n,
    createdAt: BigInt(Date.now() - 30_000),
    prompt: "A glowing purple CTA button labeled Get Started",
    generatedHtml:
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif"><button style="padding:14px 28px;border-radius:9999px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;font-weight:600;font-size:16px;box-shadow:0 0 28px -4px rgba(124,58,237,.6)">Get Started</button></div>',
  },
]);

// --- Template library ---
// Seeded templates across hero, form, nav, and card categories. The `html`
// field is a self-contained HTML document so `insertTemplate` can drop it
// straight into a generated region.
const HERO_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100%;background:#fafafa}.wrap{text-align:center;max-width:420px;padding:24px}.badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6d28d9;background:rgba(109,40,217,.08);padding:4px 12px;border-radius:999px;margin-bottom:14px}h1{font-size:30px;line-height:1.15;margin:0 0 12px;color:#1b1b2f}p{font-size:15px;color:#6b7280;margin:0 0 22px}.btns{display:flex;gap:10px;justify-content:center}.btn{background:linear-gradient(135deg,#6d28d9,#2563eb);color:#fff;border:0;border-radius:999px;padding:10px 18px;font-weight:600;font-size:14px;cursor:pointer;box-shadow:0 4px 14px -2px rgba(109,40,217,.45)}.btn.ghost{background:transparent;color:#1b1b2f;border:1px dashed #e5e7eb;box-shadow:none}</style></head><body><div class="wrap"><span class="badge">New</span><h1>Build something beautiful today</h1><p>Sketch, circle, and let AI assemble the pieces. Ship faster with a canvas that thinks.</p><div class="btns"><button class="btn">Start free</button><button class="btn ghost">Live demo</button></div></div></body></html>';

const FORM_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100%;background:#fafafa}.card{width:300px;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 8px 24px -8px rgba(27,27,47,.12)}h2{font-size:18px;margin:0 0 4px;color:#1b1b2f}.sub{font-size:12px;color:#6b7280;margin:0 0 18px}.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}label{font-size:12px;font-weight:600;color:#6b7280}input{border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:14px;color:#1b1b2f;outline:none}.btn{width:100%;background:linear-gradient(135deg,#6d28d9,#2563eb);color:#fff;border:0;border-radius:999px;padding:10px;font-weight:600;font-size:14px;cursor:pointer;margin-top:6px}.hint{font-size:11px;color:#6b7280;text-align:center;margin-top:12px}</style></head><body><div class="card"><h2>Sign in</h2><p class="sub">Welcome back — enter your details.</p><div class="field"><label>Email</label><input type="email" placeholder="you@example.com"></div><div class="field"><label>Password</label><input type="password" placeholder="••••••••"></div><button class="btn">Sign in</button><p class="hint">Forgot password?</p></div></body></html>';

const NAV_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;background:#fafafa}nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff;border-bottom:1px solid #e5e7eb;border-radius:12px}.brand{font-weight:700;font-size:16px;color:#1b1b2f}.links{display:flex;gap:18px;font-size:13px}.links a{color:#6b7280;text-decoration:none}.links a:first-child{color:#1b1b2f}.btn{background:linear-gradient(135deg,#6d28d9,#2563eb);color:#fff;border:0;border-radius:999px;padding:8px 16px;font-weight:600;font-size:13px;cursor:pointer}</style></head><body><nav><div class="brand">Brand</div><div class="links"><a href="#">Home</a><a href="#">Features</a><a href="#">Pricing</a><a href="#">About</a></div><button class="btn">Get started</button></nav></body></html>';

const CARD_HTML =
  '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100%;background:#fafafa}.card{width:280px;text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 8px 24px -8px rgba(27,27,47,.12)}.avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#6d28d9,#2563eb);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700}h3{font-size:16px;margin:0 0 6px;color:#1b1b2f}.desc{font-size:13px;color:#6b7280;margin:0 0 14px}.price{font-size:28px;font-weight:700;margin:0 0 14px;color:#1b1b2f}.price span{font-size:13px;color:#6b7280;font-weight:400}.btn{width:100%;background:linear-gradient(135deg,#6d28d9,#2563eb);color:#fff;border:0;border-radius:999px;padding:10px;font-weight:600;font-size:14px;cursor:pointer}</style></head><body><div class="card"><div class="avatar">★</div><h3>Pro plan</h3><p class="desc">Unlock unlimited canvases and AI generations.</p><div class="price">$12<span>/mo</span></div><button class="btn">Upgrade</button></div></body></html>';

const templates: TemplateView[] = [
  {
    id: 5001n,
    name: "Hero with CTA",
    description: "Centered headline, subhead, and two-button call to action.",
    category: "hero",
    html: HERO_HTML,
  },
  {
    id: 5002n,
    name: "Sign-in form",
    description: "Email and password card with a primary submit button.",
    category: "form",
    html: FORM_HTML,
  },
  {
    id: 5003n,
    name: "Top navigation bar",
    description: "Brand, link group, and a primary action button.",
    category: "nav",
    html: NAV_HTML,
  },
  {
    id: 5004n,
    name: "Pricing card",
    description: "Avatar, plan name, price, and an upgrade button.",
    category: "card",
    html: CARD_HTML,
  },
];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) =>
    typeof val === "bigint" ? val.toString() : val,
  ), (_k, val) =>
    typeof val === "string" && /^\d+$/.test(val) && val.length > 12 ? BigInt(val) : val,
  ) as T;
}

export const mockBackend: backendInterface = {
  // --- auth (no-ops for mock) ---
  _initialize_access_control: async () => undefined,
  _internet_identity_sign_in_start: async () => new Uint8Array(0),
  _internet_identity_sign_in_finish: async () => ({ __kind__: "ok" as const, ok: null }),

  // --- project ---
  getProject: async () => clone(project),
  updateProjectName: async (name: string) => {
    project.name = name;
    project.updatedAt = now();
    return clone(project);
  },

  // --- tabs ---
  getTabs: async (_projectId: bigint) => clone(tabs),
  createTab: async (projectId: bigint, name: string) => {
    const tab: TabView = {
      id: genId(),
      projectId,
      name,
      order: BigInt(tabs.length),
      createdAt: now(),
      updatedAt: now(),
    };
    tabs.push(tab);
    return clone(tab);
  },
  renameTab: async (tabId: bigint, name: string) => {
    const t = tabs.find((x) => x.id === tabId);
    if (!t) return null;
    t.name = name;
    t.updatedAt = now();
    return clone(t);
  },
  deleteTab: async (tabId: bigint) => {
    const i = tabs.findIndex((x) => x.id === tabId);
    if (i >= 0) tabs.splice(i, 1);
    strokesByTab.delete(tabId);
    commentsByTab.delete(tabId);
    regionsByTab.delete(tabId);
    return true;
  },
  reorderTabs: async (_projectId: bigint, tabIds: bigint[]) => {
    tabIds.forEach((id, idx) => {
      const t = tabs.find((x) => x.id === id);
      if (t) t.order = BigInt(idx);
    });
    return clone(tabs);
  },

  // --- strokes ---
  getStrokes: async (tabId: bigint) => clone(strokesByTab.get(tabId) ?? []),
  addStroke: async (tabId: bigint, stroke: StrokeInput) => {
    const list = strokesByTab.get(tabId) ?? [];
    const s: StrokeView = {
      id: genId(),
      tabId,
      createdAt: now(),
      color: stroke.color,
      size: stroke.size,
      tool: stroke.tool,
      points: stroke.points,
    };
    list.push(s);
    strokesByTab.set(tabId, list);
    return clone(s);
  },
  undoLastStroke: async (tabId: bigint) => {
    const list = strokesByTab.get(tabId) ?? [];
    if (list.length === 0) return null;
    const popped = list.pop()!;
    return clone(popped);
  },
  deleteStroke: async (strokeId: bigint) => {
    for (const [, list] of strokesByTab) {
      const i = list.findIndex((s) => s.id === strokeId);
      if (i >= 0) {
        list.splice(i, 1);
        return true;
      }
    }
    return false;
  },

  // --- comments ---
  getComments: async (tabId: bigint) => clone(commentsByTab.get(tabId) ?? []),
  addComment: async (tabId: bigint, comment: CommentInput) => {
    const list = commentsByTab.get(tabId) ?? [];
    const c: CommentView = {
      id: genId(),
      tabId,
      x: comment.x,
      y: comment.y,
      author: comment.author,
      text: comment.text,
      createdAt: now(),
      replies: [],
    };
    list.push(c);
    commentsByTab.set(tabId, list);
    return clone(c);
  },
  addReply: async (commentId: bigint, reply: ReplyInput) => {
    for (const [, list] of commentsByTab) {
      const c = list.find((x) => x.id === commentId);
      if (c) {
        c.replies.push({
          createdAt: now(),
          author: reply.author,
          text: reply.text,
        } as ReplyView);
        return clone(c);
      }
    }
    return null;
  },
  deleteComment: async (commentId: bigint) => {
    for (const [, list] of commentsByTab) {
      const i = list.findIndex((c) => c.id === commentId);
      if (i >= 0) {
        list.splice(i, 1);
        return true;
      }
    }
    return false;
  },

  // --- regions ---
  getRegions: async (tabId: bigint) => clone(regionsByTab.get(tabId) ?? []),
  createRegion: async (tabId: bigint, region: RegionInput) => {
    const list = regionsByTab.get(tabId) ?? [];
    const r: GeneratedRegionView = {
      id: genId(),
      tabId,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      status: RegionStatus.done,
      prompt: region.prompt,
      generatedHtml:
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#6d28d9;font-weight:600">Generated component</div>',
      createdAt: now(),
      updatedAt: now(),
    };
    list.push(r);
    regionsByTab.set(tabId, list);
    return clone(r);
  },
  updateRegion: async (regionId: bigint, updates: RegionUpdate) => {
    for (const [, list] of regionsByTab) {
      const r = list.find((x) => x.id === regionId);
      if (r) {
        if (updates.x !== undefined) r.x = updates.x;
        if (updates.y !== undefined) r.y = updates.y;
        if (updates.width !== undefined) r.width = updates.width;
        if (updates.height !== undefined) r.height = updates.height;
        if (updates.status !== undefined) r.status = updates.status;
        if (updates.prompt !== undefined) r.prompt = updates.prompt;
        if (updates.generatedHtml !== undefined)
          r.generatedHtml = updates.generatedHtml;
        r.updatedAt = now();
        return clone(r);
      }
    }
    return null;
  },
  regenerateRegion: async (regionId: bigint, newPrompt: string) => {
    for (const [, list] of regionsByTab) {
      const r = list.find((x) => x.id === regionId);
      if (r) {
        r.prompt = newPrompt;
        r.generatedHtml =
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#2563eb;font-weight:600">Regenerated</div>';
        r.status = RegionStatus.done;
        r.updatedAt = now();
        return clone(r);
      }
    }
    return null;
  },
  deleteRegion: async (regionId: bigint) => {
    for (const [, list] of regionsByTab) {
      const i = list.findIndex((r) => r.id === regionId);
      if (i >= 0) {
        list.splice(i, 1);
        return true;
      }
    }
    return false;
  },

  // --- presence (live collaboration) ---
  upsertPresence: async (presence: PresenceInput) => {
    const existing = presenceByPrincipal.get(presence.displayName);
    const view: PresenceView = {
      // Reuse the existing principal if present, otherwise mint a stable
      // pseudo-principal from the display name so repeated upserts update
      // the same record rather than creating duplicates.
      principal:
        existing?.principal ??
        `mock-${presence.displayName.toLowerCase().replace(/\s+/g, "-")}`,
      displayName: presence.displayName,
      color: presence.color,
      activeTabId: presence.activeTabId,
      cursorX: presence.cursorX,
      cursorY: presence.cursorY,
      activeTool: presence.activeTool,
      lastSeen: now(),
    };
    presenceByPrincipal.set(view.principal, view);
    return clone(view);
  },
  getPresence: async () => {
    // Drop stale presence (older than 10s) so the roster reflects "active"
    // collaborators in the mock session.
    const cutoff = BigInt(Date.now() - 10_000);
    const active = Array.from(presenceByPrincipal.values()).filter(
      (p) => p.lastSeen >= cutoff,
    );
    return clone(active);
  },

  // --- region version history ---
  listRegionVersions: async (regionId: bigint) =>
    clone(versionsByRegion.get(regionId) ?? []),
  restoreRegionVersion: async (regionId: bigint, versionId: bigint) => {
    const versions = versionsByRegion.get(regionId) ?? [];
    const version = versions.find((v) => v.versionId === versionId);
    if (!version) return null;
    for (const [, list] of regionsByTab) {
      const r = list.find((x) => x.id === regionId);
      if (r) {
        r.prompt = version.prompt;
        r.generatedHtml = version.generatedHtml;
        r.status = RegionStatus.done;
        r.updatedAt = now();
        return clone(r);
      }
    }
    return null;
  },

  // --- template library ---
  listTemplates: async () => clone(templates),
  searchTemplates: async (queryText: string) => {
    const q = queryText.trim().toLowerCase();
    if (!q) return clone(templates);
    const hits = templates.filter((t) => {
      const hay = `${t.name} ${t.description} ${t.category}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
    return clone(hits);
  },
  insertTemplate: async (
    tabId: bigint,
    templateId: bigint,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return null;
    const list = regionsByTab.get(tabId) ?? [];
    const r: GeneratedRegionView = {
      id: genId(),
      tabId,
      x,
      y,
      width,
      height,
      status: RegionStatus.done,
      prompt: `From template: ${tpl.name}`,
      generatedHtml: tpl.html,
      createdAt: now(),
      updatedAt: now(),
    };
    list.push(r);
    regionsByTab.set(tabId, list);
    return clone(r);
  },

  // --- access control ---
  getCallerUserRole: async () => UserRole.admin,
  isCallerAdmin: async () => true,
  assignCallerUserRole: async () => undefined,

  // --- OQL ---
  schema: async () => '{"entities":[]}',
  execute: async (_qJson: string): Promise<Result> => ({ hasMore: false, rows: [] }),
};
