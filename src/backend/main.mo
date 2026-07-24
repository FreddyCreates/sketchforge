import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";

import Map "mo:core/Map";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";

import Types "types/canvas";
import CanvasLib "lib/canvas";
import CanvasApi "mixins/canvas-api";
import VersionHistoryApi "mixins/version-history-api";
import PresenceApi "mixins/collaboration-presence-api";
import TemplateLibraryApi "mixins/template-library-api";

actor {
  // ---- Stable state (types only — initial values come from the migration chain) ----
  // Wrapped in a single mutable record so mixins share the same storage by
  // reference. The migration in migrations/20260723_170000.mo supplies the
  // initial empty Maps, zeroed id counters, and the curated template seed set.
  let state : CanvasLib.CanvasState;

  // ---- Existing AccessControl mixin (preserved from scaffold) ----
  // Initializer supplied by the migration chain (accessControlState field).
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // ---- Canvas domain API ----
  include CanvasApi(state);

  // ---- Region version-history API ----
  include VersionHistoryApi(state);

  // ---- Real-time collaboration presence API ----
  // Receives a PresenceState view over the shared CanvasState's presence slice
  // so presence writes propagate to the same storage the canvas mixin sees.
  include PresenceApi({
    var presence = state.presence;
    var nextPresenceId = state.nextPresenceId;
  });

  // ---- Template library API ----
  // Receives the shared CanvasState (for region creation) and a
  // TemplateLibraryState view over the templates slice.
  include TemplateLibraryApi(state, {
    var templates = state.templates;
    var nextTemplateId = state.nextTemplateId;
  });

  // ---- OQL: expose every primary stored collection for Data Intelligence ----
  // Each entity uses .controllerOnly() (the default) — the platform agent can
  // answer natural-language questions over the canvas data while it stays
  // private to end users. Samples seed schema discovery for empty collections.
  //
  // `project` and `tab` use auto mode (all-primitive fields). `stroke`,
  // `comment`, `region`, and `presence` use MANUAL mode because they carry
  // non-primitive fields (Tool/RegionStatus variants, [Point]/[Reply] arrays)
  // that OQL cannot auto-derive `_toRow` converters for. The `.payload`
  // extractors collapse those fields to OQL-compatible values:
  //   - Tool variant        → #text tag ("pen" / "eraser")
  //   - RegionStatus variant → #text tag ("pending" / "generating" / "done" / "error")
  //   - [Point] array       → #nat point count
  //   - [Reply] array       → #nat reply count
  // `regionVersion` and `template` use auto mode (all-primitive fields).
  include Expose({
    entities = [
      state.project.toEntity("project", "Types.ProjectView", "id")
        .sample({
          id = 0;
          var name = "";
          var createdAt = 0;
          var updatedAt = 0;
        })
        .controllerOnly()
        .build(),
      state.tabs.toEntity("tab", "Types.TabView", "id")
        .sample({
          id = 0;
          var projectId = 0;
          var name = "";
          var order = 0;
          var createdAt = 0;
          var updatedAt = 0;
        })
        .controllerOnly()
        .build(),
      state.strokes.toEntityManual("stroke", "Types.StrokeView", "id")
        .payload("id", func s = s.id)
        .payload("tabId", func s = s.tabId)
        .payload("pointCount", func s = s.points.size())
        .payload("color", func s = s.color)
        .payload("size", func s = s.size)
        .payload("tool", func s = switch (s.tool) { case (#pen) "pen"; case (#eraser) "eraser" })
        .payload("createdAt", func s = s.createdAt)
        .controllerOnly()
        .build(),
      state.comments.toEntityManual("comment", "Types.CommentView", "id")
        .payload("id", func c = c.id)
        .payload("tabId", func c = c.tabId)
        .payload("x", func c = c.x)
        .payload("y", func c = c.y)
        .payload("author", func c = c.author)
        .payload("text", func c = c.text)
        .payload("createdAt", func c = c.createdAt)
        .payload("replyCount", func c = c.replies.size())
        .controllerOnly()
        .build(),
      state.regions.toEntityManual("region", "Types.GeneratedRegionView", "id")
        .payload("id", func r = r.id)
        .payload("tabId", func r = r.tabId)
        .payload("x", func r = r.x)
        .payload("y", func r = r.y)
        .payload("width", func r = r.width)
        .payload("height", func r = r.height)
        .payload("prompt", func r = r.prompt)
        .payload("generatedHtml", func r = r.generatedHtml)
        .payload("status", func r = switch (r.status) { case (#pending) "pending"; case (#generating) "generating"; case (#done) "done"; case (#error) "error" })
        .payload("createdAt", func r = r.createdAt)
        .payload("updatedAt", func r = r.updatedAt)
        .controllerOnly()
        .build(),
      // Region version-history snapshots. All fields are primitives, so this
      // uses auto mode. The `regionId` field is tagged as an edge to `region`
      // so OQL queries can traverse from a version to its parent region.
      state.versions.toEntity("regionVersion", "Types.RegionVersionView", "versionId")
        .sample({
          versionId = 0;
          regionId = 0;
          prompt = "";
          generatedHtml = "";
          createdAt = 0;
        })
        .edge("regionId", "region")
        .controllerOnly()
        .build(),
      // Real-time collaboration presence. MANUAL mode because the record has
      // `var` fields (auto mode requires immutable records). The principal is
      // the natural key but is stored as Text; we expose it as the primary key
      // column so queries can group/filter by collaborator.
      state.presence.toEntityManual("presence", "Types.PresenceView", "principal")
        .payload("principal", func p = p.principal)
        .payload("displayName", func p = p.displayName)
        .payload("color", func p = p.color)
        .payload("cursorX", func p = p.cursorX)
        .payload("cursorY", func p = p.cursorY)
        .payload("activeTool", func p = p.activeTool)
        .payload("lastSeen", func p = p.lastSeen)
        .payload("activeTabId", func p = p.activeTabId)
        .controllerOnly()
        .build(),
      // Curated template library. All fields are primitives, so auto mode.
      // The `html` field is large but is a real Text column so the agent can
      // reason over template content. Templates are public reference data
      // (the AI reasons from them and any visitor can browse the catalogue),
      // so this entity uses .public_() — anyone, including anonymous callers
      // and the Data Intelligence agent, reads the full set.
      state.templates.toEntity("template", "Types.TemplateView", "id")
        .sample({
          id = 0;
          var name = "";
          var description = "";
          var category = "";
          var html = "";
        })
        .public_()
        .build(),
    ];
  });
};
