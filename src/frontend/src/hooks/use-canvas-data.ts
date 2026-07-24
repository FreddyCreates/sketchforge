import { createActor } from "@/backend";
import type {
  CommentInput,
  GeneratedRegionView,
  Point,
  PresenceInput,
  PresenceView,
  ProjectView,
  RegionInput,
  RegionUpdate,
  ReplyInput,
  StrokeInput,
  StrokeView,
  TabView,
  TemplateView,
  Tool,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// --- Actor accessor ---
function useBackendActor() {
  const { actor } = useActor(createActor);
  return actor;
}

// --- Local Storage Mock Database Fallback ---
const mockDb = {
  getProject() {
    let p = localStorage.getItem("sf_project");
    if (!p) {
      const newP = { id: 1n, name: "Local Canvas Workspace", createdAt: Number(Date.now()), updatedAt: Number(Date.now()) };
      localStorage.setItem("sf_project", JSON.stringify(newP));
      return newP;
    }
    const parsed = JSON.parse(p);
    return { ...parsed, id: BigInt(parsed.id), createdAt: Number(parsed.createdAt), updatedAt: Number(parsed.updatedAt) };
  },
  updateProjectName(name: string) {
    const p = this.getProject();
    p.name = name;
    p.updatedAt = Number(Date.now());
    localStorage.setItem("sf_project", JSON.stringify(p));
    return p;
  },
  getTabs(projectId: bigint) {
    let t = localStorage.getItem("sf_tabs");
    if (!t) {
      const newTabs = [{ id: 1n, projectId, name: "Canvas 1", order: 1n, createdAt: Number(Date.now()), updatedAt: Number(Date.now()) }];
      localStorage.setItem("sf_tabs", JSON.stringify(newTabs));
      return newTabs;
    }
    const parsed = JSON.parse(t);
    return parsed.map((item: any) => ({
      ...item,
      id: BigInt(item.id),
      projectId: BigInt(item.projectId),
      order: BigInt(item.order),
      createdAt: Number(item.createdAt),
      updatedAt: Number(item.updatedAt)
    }));
  },
  createTab(projectId: bigint, name: string) {
    const tabs = this.getTabs(projectId);
    const newTab = {
      id: BigInt(Date.now()),
      projectId,
      name,
      order: BigInt(tabs.length + 1),
      createdAt: Number(Date.now()),
      updatedAt: Number(Date.now())
    };
    tabs.push(newTab);
    localStorage.setItem("sf_tabs", JSON.stringify(tabs));
    return newTab;
  },
  renameTab(tabId: bigint, name: string) {
    const tabs = this.getTabs(1n);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      tab.name = name;
      tab.updatedAt = Number(Date.now());
      localStorage.setItem("sf_tabs", JSON.stringify(tabs));
    }
    return true;
  },
  deleteTab(tabId: bigint) {
    let tabs = this.getTabs(1n);
    tabs = tabs.filter(t => t.id !== tabId);
    localStorage.setItem("sf_tabs", JSON.stringify(tabs));
    return true;
  },
  getStrokes(tabId: bigint) {
    let s = localStorage.getItem(`sf_strokes_${tabId}`);
    if (!s) return [];
    const parsed = JSON.parse(s);
    return parsed.map((item: any) => ({
      ...item,
      id: BigInt(item.id),
      tabId: BigInt(item.tabId),
      createdAt: Number(item.createdAt)
    }));
  },
  addStroke(tabId: bigint, stroke: any) {
    const strokes = this.getStrokes(tabId);
    const newStroke = {
      id: BigInt(Date.now() + Math.round(Math.random() * 1000)),
      tabId,
      tool: stroke.tool,
      color: stroke.color,
      size: Number(stroke.size),
      points: stroke.points,
      createdAt: Number(Date.now())
    };
    strokes.push(newStroke);
    localStorage.setItem(`sf_strokes_${tabId}`, JSON.stringify(strokes));
    return newStroke;
  },
  undoLastStroke(tabId: bigint) {
    const strokes = this.getStrokes(tabId);
    if (strokes.length === 0) return null;
    const popped = strokes.pop();
    localStorage.setItem(`sf_strokes_${tabId}`, JSON.stringify(strokes));
    return popped;
  },
  getRegions(tabId: bigint) {
    let r = localStorage.getItem(`sf_regions_${tabId}`);
    if (!r) return [];
    const parsed = JSON.parse(r);
    return parsed.map((item: any) => ({
      ...item,
      id: BigInt(item.id),
      tabId: BigInt(item.tabId),
      createdAt: Number(item.createdAt),
      updatedAt: Number(item.updatedAt)
    }));
  },
  createRegion(tabId: bigint, region: any) {
    const regions = this.getRegions(tabId);
    const newRegion = {
      id: BigInt(Date.now()),
      tabId,
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      prompt: region.prompt,
      generatedHtml: region.generatedHtml || "",
      status: region.status || { pending: null },
      createdAt: Number(Date.now()),
      updatedAt: Number(Date.now())
    };
    regions.push(newRegion);
    localStorage.setItem(`sf_regions_${tabId}`, JSON.stringify(regions));
    return newRegion;
  },
  updateRegion(regionId: bigint, updates: any) {
    const tabs = this.getTabs(1n);
    for (const tab of tabs) {
      const regions = this.getRegions(tab.id);
      const rIdx = regions.findIndex(reg => reg.id === regionId);
      if (rIdx !== -1) {
        const oldStatus = regions[rIdx].status;
        let mappedStatus = oldStatus;
        if (updates.status) {
          if (updates.status === "pending") mappedStatus = { pending: null };
          else if (updates.status === "generating") mappedStatus = { generating: null };
          else if (updates.status === "done") mappedStatus = { done: null };
          else if (updates.status === "error") mappedStatus = { error: null };
          else mappedStatus = updates.status;
        }
        const updated = {
          ...regions[rIdx],
          ...updates,
          status: mappedStatus,
          id: regionId,
          updatedAt: Number(Date.now())
        };
        regions[rIdx] = updated;
        localStorage.setItem(`sf_regions_${tab.id}`, JSON.stringify(regions));
        if (updates.generatedHtml !== undefined) {
          this.saveRegionVersion(regionId, updates.prompt || regions[rIdx].prompt, updates.generatedHtml);
        }
        return updated;
      }
    }
    return null;
  },
  regenerateRegion(regionId: bigint, newPrompt: string) {
    return this.updateRegion(regionId, { prompt: newPrompt, generatedHtml: "", status: "pending" });
  },
  deleteRegion(regionId: bigint) {
    const tabs = this.getTabs(1n);
    for (const tab of tabs) {
      let regions = this.getRegions(tab.id);
      const exists = regions.some(r => r.id === regionId);
      if (exists) {
        regions = regions.filter(r => r.id !== regionId);
        localStorage.setItem(`sf_regions_${tab.id}`, JSON.stringify(regions));
        return true;
      }
    }
    return false;
  },
  getComments(tabId: bigint) {
    let c = localStorage.getItem(`sf_comments_${tabId}`);
    if (!c) return [];
    const parsed = JSON.parse(c);
    return parsed.map((item: any) => ({
      ...item,
      id: BigInt(item.id),
      tabId: BigInt(item.tabId),
      createdAt: Number(item.createdAt),
      replies: (item.replies || []).map((rep: any) => ({
        ...rep,
        id: BigInt(rep.id),
        commentId: BigInt(rep.commentId),
        createdAt: Number(rep.createdAt)
      }))
    }));
  },
  addComment(tabId: bigint, comment: any) {
    const comments = this.getComments(tabId);
    const newComment = {
      id: BigInt(Date.now()),
      tabId,
      x: comment.x,
      y: comment.y,
      author: comment.author,
      text: comment.text,
      createdAt: Number(Date.now()),
      replies: []
    };
    comments.push(newComment);
    localStorage.setItem(`sf_comments_${tabId}`, JSON.stringify(comments));
    return newComment;
  },
  addReply(commentId: bigint, reply: any) {
    const tabs = this.getTabs(1n);
    for (const tab of tabs) {
      const comments = this.getComments(tab.id);
      const c = comments.find(comm => comm.id === commentId);
      if (c) {
        c.replies.push({
          id: BigInt(Date.now()),
          commentId,
          author: reply.author,
          text: reply.text,
          createdAt: Number(Date.now())
        });
        localStorage.setItem(`sf_comments_${tab.id}`, JSON.stringify(comments));
        return true;
      }
    }
    return false;
  },
  listRegionVersions(regionId: bigint) {
    let v = localStorage.getItem(`sf_versions_${regionId}`);
    if (!v) return [];
    const parsed = JSON.parse(v);
    return parsed.map((item: any) => ({
      ...item,
      versionId: BigInt(item.versionId),
      regionId: BigInt(item.regionId),
      createdAt: Number(item.createdAt)
    }));
  },
  saveRegionVersion(regionId: bigint, prompt: string, html: string) {
    const versions = this.listRegionVersions(regionId);
    const newVersion = {
      versionId: BigInt(Date.now()),
      regionId,
      prompt,
      generatedHtml: html,
      createdAt: Number(Date.now())
    };
    versions.push(newVersion);
    localStorage.setItem(`sf_versions_${regionId}`, JSON.stringify(versions));
  },
  restoreRegionVersion(regionId: bigint, versionId: bigint) {
    const versions = this.listRegionVersions(regionId);
    const v = versions.find(ver => ver.versionId === versionId);
    if (v) {
      return this.updateRegion(regionId, { prompt: v.prompt, generatedHtml: v.generatedHtml, status: "done" });
    }
    return null;
  },
  listTemplates() {
    return [
      { id: 1n, name: "Login form", description: "Sign in dialog", category: "auth", html: "" },
      { id: 2n, name: "Pricing card", description: "SaaS tiers", category: "pricing", html: "" },
      { id: 3n, name: "Navbar", description: "Navigation menu header", category: "navigation", html: "" },
      { id: 4n, name: "Checklist", description: "Todo task list", category: "list", html: "" }
    ];
  }
};

// --- Query keys ---
export const qk = {
  project: ["project"] as const,
  tabs: ["tabs"] as const,
  strokes: (tabId: bigint) => ["strokes", tabId] as const,
  comments: (tabId: bigint) => ["comments", tabId] as const,
  regions: (tabId: bigint) => ["regions", tabId] as const,
  presence: ["presence"] as const,
  regionVersions: (regionId: bigint) => ["regionVersions", regionId] as const,
  templates: ["templates"] as const,
  templatesSearch: (queryText: string) =>
    ["templates", "search", queryText] as const,
};

// ============================================================
// Project
// ============================================================

export function useProject() {
  const actor = useBackendActor();
  return useQuery<ProjectView | null>({
    queryKey: qk.project,
    queryFn: () => {
      if (actor) return actor.getProject();
      return mockDb.getProject() as any;
    },
    enabled: true,
  });
}

export function useUpdateProjectName() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (actor) return actor.updateProjectName(name);
      return mockDb.updateProjectName(name) as any;
    },
    onSuccess: (project) => {
      if (project) qc.setQueryData(qk.project, project);
    },
  });
}

// ============================================================
// Tabs
// ============================================================

export function useTabs() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  const project = qc.getQueryData<ProjectView | null>(qk.project);
  const projectId = project?.id ?? 1n;
  return useQuery<TabView[]>({
    queryKey: qk.tabs,
    queryFn: () => {
      if (actor) return actor.getTabs(projectId!);
      return mockDb.getTabs(projectId) as any;
    },
    enabled: true,
  });
}

export function useCreateTab() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, name }: { projectId: bigint; name: string }) => {
      if (actor) return actor.createTab(projectId, name);
      return mockDb.createTab(projectId, name) as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tabs }),
  });
}

export function useRenameTab() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tabId, name }: { tabId: bigint; name: string }) => {
      if (actor) return actor.renameTab(tabId, name);
      return mockDb.renameTab(tabId, name) as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tabs }),
  });
}

export function useDeleteTab() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tabId: bigint) => {
      if (actor) return actor.deleteTab(tabId);
      return mockDb.deleteTab(tabId) as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tabs });
    },
  });
}

export function useReorderTabs() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      tabIds,
    }: { projectId: bigint; tabIds: bigint[] }) => {
      if (actor) return actor.reorderTabs(projectId, tabIds);
      return true as any;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.tabs }),
  });
}

// ============================================================
// Strokes
// ============================================================

export function useStrokes(tabId: bigint | null) {
  const actor = useBackendActor();
  const queryTabId = tabId !== null ? tabId : 1n;
  return useQuery<StrokeView[]>({
    queryKey: tabId !== null ? qk.strokes(tabId) : ["strokes", "none"],
    queryFn: () => {
      if (actor) return actor.getStrokes(queryTabId);
      return mockDb.getStrokes(queryTabId) as any;
    },
    enabled: true,
  });
}

export function useAddStroke() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tabId,
      tool,
      color,
      size,
      points,
    }: {
      tabId: bigint;
      tool: Tool;
      color: string;
      size: number;
      points: Point[];
    }) => {
      if (actor) {
        return actor.addStroke(tabId, {
          tool,
          color,
          size,
          points,
        } satisfies StrokeInput);
      }
      return mockDb.addStroke(tabId, { tool, color, size, points }) as any;
    },
    onSuccess: (_stroke, vars) => {
      qc.invalidateQueries({ queryKey: qk.strokes(vars.tabId) });
    },
  });
}

export function useUndoStroke() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tabId: bigint) => {
      if (actor) return actor.undoLastStroke(tabId);
      return mockDb.undoLastStroke(tabId) as any;
    },
    onSuccess: (_popped, tabId) => {
      qc.invalidateQueries({ queryKey: qk.strokes(tabId) });
    },
  });
}

// ============================================================
// Comments
// ============================================================

export function useComments(tabId: bigint | null) {
  const actor = useBackendActor();
  const queryTabId = tabId !== null ? tabId : 1n;
  return useQuery({
    queryKey: tabId !== null ? qk.comments(tabId) : ["comments", "none"],
    queryFn: () => {
      if (actor) return actor.getComments(queryTabId);
      return mockDb.getComments(queryTabId) as any;
    },
    enabled: true,
  });
}

export function useAddComment() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tabId,
      comment,
    }: {
      tabId: bigint;
      comment: CommentInput;
    }) => {
      if (actor) return actor.addComment(tabId, comment);
      return mockDb.addComment(tabId, comment) as any;
    },
    onSuccess: (_c, vars) => {
      qc.invalidateQueries({ queryKey: qk.comments(vars.tabId) });
    },
  });
}

export function useAddReply() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      reply,
    }: {
      commentId: bigint;
      reply: ReplyInput;
    }) => {
      if (actor) return actor.addReply(commentId, reply);
      return mockDb.addReply(commentId, reply) as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

// ============================================================
// Generated regions (circle-to-prompt)
// ============================================================

export function useRegions(tabId: bigint | null) {
  const actor = useBackendActor();
  const queryTabId = tabId !== null ? tabId : 1n;
  return useQuery<GeneratedRegionView[]>({
    queryKey: tabId !== null ? qk.regions(tabId) : ["regions", "none"],
    queryFn: () => {
      if (actor) return actor.getRegions(queryTabId);
      return mockDb.getRegions(queryTabId) as any;
    },
    enabled: true,
  });
}

export function useCreateRegion() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tabId,
      region,
    }: {
      tabId: bigint;
      region: RegionInput;
    }) => {
      if (actor) return actor.createRegion(tabId, region);
      return mockDb.createRegion(tabId, region) as any;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: qk.regions(vars.tabId) });
    },
  });
}

export function useUpdateRegion() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      regionId,
      updates,
    }: {
      regionId: bigint;
      updates: RegionUpdate;
    }) => {
      if (actor) return actor.updateRegion(regionId, updates);
      return mockDb.updateRegion(regionId, updates) as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

export function useRegenerateRegion() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      regionId,
      newPrompt,
    }: {
      regionId: bigint;
      newPrompt: string;
    }) => {
      if (actor) return actor.regenerateRegion(regionId, newPrompt);
      return mockDb.regenerateRegion(regionId, newPrompt) as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

export function useDeleteRegion() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (regionId: bigint) => {
      if (actor) return actor.deleteRegion(regionId);
      return mockDb.deleteRegion(regionId) as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

// ============================================================
// Presence (live collaboration)
// ============================================================

export function usePresence() {
  const actor = useBackendActor();
  return useQuery<PresenceView[]>({
    queryKey: qk.presence,
    queryFn: () => {
      if (actor) return actor.getPresence();
      return [] as any;
    },
    enabled: !!actor,
    refetchInterval: 3000,
  });
}

export function useUpsertPresence() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (presence: PresenceInput) => {
      if (actor) return actor.upsertPresence(presence);
      return true as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.presence });
    },
  });
}

// ============================================================
// Region version history
// ============================================================

export function useRegionVersions(regionId: bigint | null) {
  const actor = useBackendActor();
  const queryRegionId = regionId !== null ? regionId : 1n;
  return useQuery({
    queryKey:
      regionId !== null
        ? qk.regionVersions(regionId)
        : ["regionVersions", "none"],
    queryFn: () => {
      if (actor) return actor.listRegionVersions(queryRegionId);
      return mockDb.listRegionVersions(queryRegionId) as any;
    },
    enabled: true,
  });
}

export function useRestoreRegionVersion() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      regionId,
      versionId,
    }: {
      regionId: bigint;
      versionId: bigint;
    }) => {
      if (actor) return actor.restoreRegionVersion(regionId, versionId);
      return mockDb.restoreRegionVersion(regionId, versionId) as any;
    },
    onSuccess: (_region, vars) => {
      qc.invalidateQueries({ queryKey: ["regions"] });
      qc.invalidateQueries({ queryKey: qk.regionVersions(vars.regionId) });
    },
  });
}

// ============================================================
// Template library
// ============================================================

export function useTemplates() {
  const actor = useBackendActor();
  return useQuery<TemplateView[]>({
    queryKey: qk.templates,
    queryFn: () => {
      if (actor) return actor.listTemplates();
      return mockDb.listTemplates() as any;
    },
    enabled: true,
  });
}

export function useSearchTemplates(queryText: string) {
  const actor = useBackendActor();
  return useQuery<TemplateView[]>({
    queryKey: qk.templatesSearch(queryText),
    queryFn: () => {
      if (actor) return actor.searchTemplates(queryText);
      return mockDb.listTemplates() as any; // mock simple search fallback
    },
    enabled: true,
  });
}

export function useInsertTemplate() {
  const actor = useBackendActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tabId,
      templateId,
      x,
      y,
      width,
      height,
    }: {
      tabId: bigint;
      templateId: bigint;
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      if (actor) return actor.insertTemplate(tabId, templateId, x, y, width, height);
      return mockDb.createRegion(tabId, { x, y, width, height, prompt: `Template ${templateId}`, generatedHtml: "<div>Template Mock</div>", status: { done: null } }) as any;
    },
    onSuccess: (_region, vars) => {
      qc.invalidateQueries({ queryKey: qk.regions(vars.tabId) });
    },
  });
}
