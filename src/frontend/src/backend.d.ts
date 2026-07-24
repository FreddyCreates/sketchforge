import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface ReplyInput {
    text: string;
    author: string;
}
export interface Point {
    x: number;
    y: number;
}
export type TemplateId = bigint;
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ReplyView {
    createdAt: Timestamp;
    text: string;
    author: string;
}
export interface GeneratedRegionView {
    x: number;
    y: number;
    id: RegionId;
    height: number;
    status: RegionStatus;
    tabId: TabId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    prompt: string;
    width: number;
    generatedHtml: string;
}
export interface TemplateView {
    id: TemplateId;
    html: string;
    name: string;
    description: string;
    category: string;
}
export interface TabView {
    id: TabId;
    order: bigint;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    projectId: ProjectId;
}
export interface RegionVersionView {
    versionId: bigint;
    createdAt: Timestamp;
    prompt: string;
    regionId: RegionId;
    generatedHtml: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface PresenceInput {
    displayName: string;
    color: string;
    activeTabId: TabId;
    cursorX: number;
    cursorY: number;
    activeTool: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type PrincipalText = string;
export type StrokeId = bigint;
export interface RegionUpdate {
    x?: number;
    y?: number;
    height?: number;
    status?: RegionStatus;
    prompt?: string;
    width?: number;
    generatedHtml?: string;
}
export type CommentId = bigint;
export interface PresenceView {
    principal: PrincipalText;
    displayName: string;
    color: string;
    activeTabId: TabId;
    cursorX: number;
    cursorY: number;
    lastSeen: Timestamp;
    activeTool: string;
}
export interface ProjectView {
    id: ProjectId;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface CommentView {
    x: number;
    y: number;
    id: CommentId;
    tabId: TabId;
    createdAt: Timestamp;
    text: string;
    author: string;
    replies: Array<ReplyView>;
}
export interface StrokeInput {
    color: string;
    size: number;
    tool: Tool;
    points: Array<Point>;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type RegionId = bigint;
export interface CommentInput {
    x: number;
    y: number;
    text: string;
    author: string;
}
export type ProjectId = bigint;
export type TabId = bigint;
export interface StrokeView {
    id: StrokeId;
    tabId: TabId;
    createdAt: Timestamp;
    color: string;
    size: number;
    tool: Tool;
    points: Array<Point>;
}
export interface RegionInput {
    x: number;
    y: number;
    height: number;
    prompt: string;
    width: number;
}
export enum RegionStatus {
    pending = "pending",
    done = "done",
    generating = "generating",
    error = "error"
}
export enum Tool {
    pen = "pen",
    eraser = "eraser"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(tabId: TabId, comment: CommentInput): Promise<CommentView | null>;
    addReply(commentId: CommentId, reply: ReplyInput): Promise<CommentView | null>;
    addStroke(tabId: TabId, stroke: StrokeInput): Promise<StrokeView | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRegion(tabId: TabId, region: RegionInput): Promise<GeneratedRegionView | null>;
    createTab(projectId: ProjectId, name: string): Promise<TabView | null>;
    deleteComment(commentId: CommentId): Promise<boolean | null>;
    deleteRegion(regionId: RegionId): Promise<boolean | null>;
    deleteStroke(strokeId: StrokeId): Promise<boolean | null>;
    deleteTab(tabId: TabId): Promise<boolean | null>;
    execute(qJson: string): Promise<Result>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(tabId: TabId): Promise<Array<CommentView>>;
    getPresence(): Promise<Array<PresenceView>>;
    getProject(): Promise<ProjectView | null>;
    getRegions(tabId: TabId): Promise<Array<GeneratedRegionView>>;
    getStrokes(tabId: TabId): Promise<Array<StrokeView>>;
    getTabs(projectId: ProjectId): Promise<Array<TabView>>;
    insertTemplate(tabId: TabId, templateId: TemplateId, x: number, y: number, width: number, height: number): Promise<GeneratedRegionView | null>;
    isCallerAdmin(): Promise<boolean>;
    listRegionVersions(regionId: RegionId): Promise<Array<RegionVersionView>>;
    listTemplates(): Promise<Array<TemplateView>>;
    regenerateRegion(regionId: RegionId, newPrompt: string): Promise<GeneratedRegionView | null>;
    renameTab(tabId: TabId, name: string): Promise<TabView | null>;
    reorderTabs(projectId: ProjectId, tabIds: Array<TabId>): Promise<Array<TabView>>;
    restoreRegionVersion(regionId: RegionId, versionId: bigint): Promise<GeneratedRegionView | null>;
    schema(): Promise<string>;
    searchTemplates(queryText: string): Promise<Array<TemplateView>>;
    undoLastStroke(tabId: TabId): Promise<StrokeView | null>;
    updateProjectName(name: string): Promise<ProjectView | null>;
    updateRegion(regionId: RegionId, updates: RegionUpdate): Promise<GeneratedRegionView | null>;
    upsertPresence(presence: PresenceInput): Promise<PresenceView>;
}
