import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/canvas";
import VersionHistoryTypes "../types/version-history";
import VersionHistory "../lib/version-history";
import PresenceTypes "../types/collaboration-presence";
import Presence "../lib/collaboration-presence";
import TemplateTypes "../types/template-library";
import TemplateLibrary "../lib/template-library";

// Domain logic for the canvas app. Stateless module — all storage is injected
// by the mixin layer. Reads/writes happen against the injected Maps; secondary
// indexes (e.g. strokes by tabId) are derived on demand via Map.filter.
module {
  public type Project = Types.Project;
  public type Tab = Types.Tab;
  public type Stroke = Types.Stroke;
  public type Comment = Types.Comment;
  public type Reply = Types.Reply;
  public type GeneratedRegion = Types.GeneratedRegion;

  public type ProjectView = Types.ProjectView;
  public type TabView = Types.TabView;
  public type StrokeView = Types.StrokeView;
  public type CommentView = Types.CommentView;
  public type ReplyView = Types.ReplyView;
  public type GeneratedRegionView = Types.GeneratedRegionView;

  public type StrokeInput = Types.StrokeInput;
  public type CommentInput = Types.CommentInput;
  public type ReplyInput = Types.ReplyInput;
  public type RegionInput = Types.RegionInput;
  public type RegionUpdate = Types.RegionUpdate;

  public type RegionVersion = VersionHistoryTypes.RegionVersion;
  public type RegionVersionView = VersionHistoryTypes.RegionVersionView;

  public type Presence = PresenceTypes.Presence;
  public type PresenceView = PresenceTypes.PresenceView;
  public type Template = TemplateTypes.Template;
  public type TemplateView = TemplateTypes.TemplateView;

  // Storage shape injected from main.mo. Each collection is keyed by its
  // entity id; secondary indexes (e.g. strokes by tabId) are derived here
  // via Map.filter rather than stored. The `versions` map and
  // `nextVersionId` counter back the region version-history feature: each
  // regenerateRegion call pushes a snapshot of the prior {prompt,
  // generatedHtml, createdAt} keyed by a monotonic versionId. The `presence`
  // map + `nextPresenceId` back real-time collaboration, and `templates` +
  // `nextTemplateId` back the curated template library.
  public type CanvasState = {
    var project : Map.Map<Types.ProjectId, Project>;
    var tabs : Map.Map<Types.TabId, Tab>;
    var strokes : Map.Map<Types.StrokeId, Stroke>;
    var comments : Map.Map<Types.CommentId, Comment>;
    var regions : Map.Map<Types.RegionId, GeneratedRegion>;
    var versions : Map.Map<Nat, RegionVersion>;
    var presence : Map.Map<PresenceTypes.PrincipalText, Presence>;
    var templates : Map.Map<TemplateTypes.TemplateId, Template>;
    var nextProjectId : Nat;
    var nextTabId : Nat;
    var nextStrokeId : Nat;
    var nextCommentId : Nat;
    var nextRegionId : Nat;
    var nextVersionId : Nat;
    var nextPresenceId : Nat;
    var nextTemplateId : Nat;
  };

  // Time.now() returns Int (nanoseconds); our Timestamp is Nat. Convert with
  // Int.abs so stored values stay Candid/OQL-friendly. Public so the mixin
  // layer can reuse the same clock for lazy project init.
  public func now() : Types.Timestamp {
    Int.abs(Time.now());
  };

  // ---- Project ----
  public func getProjectView(self : Project) : ProjectView {
    {
      id = self.id;
      name = self.name;
      createdAt = self.createdAt;
      updatedAt = self.updatedAt;
    };
  };

  public func updateProjectName(self : Project, name : Text) : ProjectView {
    self.name := name;
    self.updatedAt := now();
    getProjectView(self);
  };

  // ---- Tabs ----
  public func getTabView(self : Tab) : TabView {
    {
      id = self.id;
      projectId = self.projectId;
      name = self.name;
      order = self.order;
      createdAt = self.createdAt;
      updatedAt = self.updatedAt;
    };
  };

  public func listTabViews(tabs : Map.Map<Types.TabId, Tab>, projectId : Types.ProjectId) : [TabView] {
    let matching = tabs.filter(func(_id : Types.TabId, tab : Tab) : Bool {
      tab.projectId == projectId;
    });
    let pairs = matching.toArray();
    let views = pairs.map(
      func(p : (Types.TabId, Tab)) : TabView { getTabView(p.1) },
    );
    views.sort(func(a, b) = Nat.compare(a.order, b.order));
  };

  public func createTab(state : CanvasState, projectId : Types.ProjectId, name : Text) : TabView {
    let id = state.nextTabId;
    state.nextTabId := id + 1;
    // New tabs go to the end of the order for their project.
    let existing = listTabViews(state.tabs, projectId);
    let order = existing.size();
    let ts = now();
    let tab : Tab = {
      id;
      var projectId;
      var name;
      var order;
      var createdAt = ts;
      var updatedAt = ts;
    };
    state.tabs.add(id, tab);
    getTabView(tab);
  };

  public func renameTab(self : Tab, name : Text) : TabView {
    self.name := name;
    self.updatedAt := now();
    getTabView(self);
  };

  public func reorderTabs(tabs : Map.Map<Types.TabId, Tab>, projectId : Types.ProjectId, tabIds : [Types.TabId]) : [TabView] {
    // Reassign `order` for each tab in the supplied sequence. Tabs not in the
    // list keep their existing order; tabs in the list get 0..n-1 in sequence.
    var idx : Nat = 0;
    for (tid in tabIds.values()) {
      switch (tabs.get(tid)) {
        case (?tab) {
          if (tab.projectId == projectId) {
            tab.order := idx;
            tab.updatedAt := now();
            idx := idx + 1;
          };
        };
        case null {};
      };
    };
    listTabViews(tabs, projectId);
  };

  public func deleteTab(state : CanvasState, tabId : Types.TabId) : () {
    // Cascade-delete the tab's strokes, comments, and regions, then the tab.
    let strokesToDelete = state.strokes.filter(func(_id : Types.StrokeId, s : Stroke) : Bool {
      s.tabId == tabId;
    });
    for ((sid, _) in strokesToDelete.entries()) {
      state.strokes.remove(sid);
    };
    let commentsToDelete = state.comments.filter(func(_id : Types.CommentId, c : Comment) : Bool {
      c.tabId == tabId;
    });
    for ((cid, _) in commentsToDelete.entries()) {
      state.comments.remove(cid);
    };
    let regionsToDelete = state.regions.filter(func(_id : Types.RegionId, r : GeneratedRegion) : Bool {
      r.tabId == tabId;
    });
    for ((rid, _) in regionsToDelete.entries()) {
      state.regions.remove(rid);
    };
    state.tabs.remove(tabId);
  };

  // ---- Strokes ----
  public func getStrokeView(self : Stroke) : StrokeView {
    {
      id = self.id;
      tabId = self.tabId;
      points = self.points;
      color = self.color;
      size = self.size;
      tool = self.tool;
      createdAt = self.createdAt;
    };
  };

  public func listStrokeViews(strokes : Map.Map<Types.StrokeId, Stroke>, tabId : Types.TabId) : [StrokeView] {
    let matching = strokes.filter(func(_id : Types.StrokeId, s : Stroke) : Bool {
      s.tabId == tabId;
    });
    let pairs = matching.toArray();
    let views = pairs.map(
      func(p : (Types.StrokeId, Stroke)) : StrokeView { getStrokeView(p.1) },
    );
    // Oldest first by id (id is monotonic by creation order).
    views.sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  public func addStroke(state : CanvasState, tabId : Types.TabId, input : StrokeInput) : StrokeView {
    let id = state.nextStrokeId;
    state.nextStrokeId := id + 1;
    let stroke : Stroke = {
      id;
      var tabId;
      var points = input.points;
      var color = input.color;
      var size = input.size;
      var tool = input.tool;
      var createdAt = now();
    };
    state.strokes.add(id, stroke);
    getStrokeView(stroke);
  };

  public func deleteStroke(strokes : Map.Map<Types.StrokeId, Stroke>, strokeId : Types.StrokeId) : () {
    strokes.remove(strokeId);
  };

  public func undoLastStroke(state : CanvasState, tabId : Types.TabId) : ?StrokeView {
    // Find the highest-id stroke belonging to this tab and remove it.
    let matching = state.strokes.filter(func(_id : Types.StrokeId, s : Stroke) : Bool {
      s.tabId == tabId;
    });
    let pairs = matching.toArray();
    if (pairs.size() == 0) {
      return null;
    };
    let sorted = pairs.sort(func(a, b) = Nat.compare(b.0, a.0));
    let (lastId, lastStroke) = sorted[0];
    let view = getStrokeView(lastStroke);
    state.strokes.remove(lastId);
    ?view;
  };

  // ---- Comments ----
  public func getReplyView(self : Reply) : ReplyView {
    {
      author = self.author;
      text = self.text;
      createdAt = self.createdAt;
    };
  };

  public func getCommentView(self : Comment) : CommentView {
    let replyViews = self.replies.map(func(r) = getReplyView(r));
    {
      id = self.id;
      tabId = self.tabId;
      x = self.x;
      y = self.y;
      author = self.author;
      text = self.text;
      createdAt = self.createdAt;
      replies = replyViews;
    };
  };

  public func listCommentViews(comments : Map.Map<Types.CommentId, Comment>, tabId : Types.TabId) : [CommentView] {
    let matching = comments.filter(func(_id : Types.CommentId, c : Comment) : Bool {
      c.tabId == tabId;
    });
    let pairs = matching.toArray();
    let views = pairs.map(
      func(p : (Types.CommentId, Comment)) : CommentView { getCommentView(p.1) },
    );
    views.sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  public func addComment(state : CanvasState, tabId : Types.TabId, input : CommentInput) : CommentView {
    let id = state.nextCommentId;
    state.nextCommentId := id + 1;
    let comment : Comment = {
      id;
      var tabId;
      var x = input.x;
      var y = input.y;
      var author = input.author;
      var text = input.text;
      var createdAt = now();
      var replies = [] : [Reply];
    };
    state.comments.add(id, comment);
    getCommentView(comment);
  };

  public func addReply(comments : Map.Map<Types.CommentId, Comment>, commentId : Types.CommentId, input : ReplyInput) : CommentView {
    let comment = switch (comments.get(commentId)) {
      case (?c) c;
      case null Runtime.trap("Comment not found");
    };
    let reply : Reply = {
      var author = input.author;
      var text = input.text;
      var createdAt = now();
    };
    comment.replies := comment.replies.concat([reply]);
    getCommentView(comment);
  };

  public func deleteComment(comments : Map.Map<Types.CommentId, Comment>, commentId : Types.CommentId) : () {
    comments.remove(commentId);
  };

  // ---- Generated regions ----
  public func getRegionView(self : GeneratedRegion) : GeneratedRegionView {
    {
      id = self.id;
      tabId = self.tabId;
      x = self.x;
      y = self.y;
      width = self.width;
      height = self.height;
      prompt = self.prompt;
      generatedHtml = self.generatedHtml;
      status = self.status;
      createdAt = self.createdAt;
      updatedAt = self.updatedAt;
    };
  };

  public func listRegionViews(regions : Map.Map<Types.RegionId, GeneratedRegion>, tabId : Types.TabId) : [GeneratedRegionView] {
    let matching = regions.filter(func(_id : Types.RegionId, r : GeneratedRegion) : Bool {
      r.tabId == tabId;
    });
    let pairs = matching.toArray();
    let views = pairs.map(
      func(p : (Types.RegionId, GeneratedRegion)) : GeneratedRegionView { getRegionView(p.1) },
    );
    views.sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  public func createRegion(state : CanvasState, tabId : Types.TabId, input : RegionInput) : GeneratedRegionView {
    let id = state.nextRegionId;
    state.nextRegionId := id + 1;
    let ts = now();
    let region : GeneratedRegion = {
      id;
      var tabId;
      var x = input.x;
      var y = input.y;
      var width = input.width;
      var height = input.height;
      var prompt = input.prompt;
      var generatedHtml = "";
      var status = #pending;
      var createdAt = ts;
      var updatedAt = ts;
    };
    state.regions.add(id, region);
    getRegionView(region);
  };

  // Create a generated region with both prompt and generatedHtml pre-filled
  // and status set to #done. Used by the template-library domain to drop a
  // curated template onto the canvas as a finished region in one step.
  public func createRegionWithHtml(state : CanvasState, tabId : Types.TabId, x : Float, y : Float, width : Float, height : Float, prompt : Text, generatedHtml : Text) : GeneratedRegionView {
    let id = state.nextRegionId;
    state.nextRegionId := id + 1;
    let ts = now();
    let region : GeneratedRegion = {
      id;
      var tabId;
      var x;
      var y;
      var width;
      var height;
      var prompt;
      var generatedHtml;
      var status = #done;
      var createdAt = ts;
      var updatedAt = ts;
    };
    state.regions.add(id, region);
    getRegionView(region);
  };

  public func updateRegion(regions : Map.Map<Types.RegionId, GeneratedRegion>, regionId : Types.RegionId, updates : RegionUpdate) : GeneratedRegionView {
    let region = switch (regions.get(regionId)) {
      case (?r) r;
      case null Runtime.trap("Region not found");
    };
    switch (updates.x) { case (?v) region.x := v; case null {} };
    switch (updates.y) { case (?v) region.y := v; case null {} };
    switch (updates.width) { case (?v) region.width := v; case null {} };
    switch (updates.height) { case (?v) region.height := v; case null {} };
    switch (updates.prompt) { case (?v) region.prompt := v; case null {} };
    switch (updates.generatedHtml) {
      case (?v) {
        region.generatedHtml := v;
        // Setting generated HTML marks the region as done.
        region.status := #done;
      };
      case null {};
    };
    switch (updates.status) { case (?v) region.status := v; case null {} };
    region.updatedAt := now();
    getRegionView(region);
  };

  public func regenerateRegion(state : CanvasState, regions : Map.Map<Types.RegionId, GeneratedRegion>, regionId : Types.RegionId, newPrompt : Text) : GeneratedRegionView {
    let region = switch (regions.get(regionId)) {
      case (?r) r;
      case null Runtime.trap("Region not found");
    };
    // BEFORE overwriting, push a snapshot of the current {prompt,
    // generatedHtml, createdAt} into the versions map so the prior content
    // is preserved as a restorable version. Only snapshot when there is
    // meaningful prior content (a non-empty prompt or generatedHtml) so the
    // first generation of a fresh region does not create an empty snapshot.
    if (region.prompt.size() > 0 or region.generatedHtml.size() > 0) {
      let versionState : VersionHistory.VersionState = {
        var versions = state.versions;
        var nextVersionId = state.nextVersionId;
      };
      let _snapshot = VersionHistory.pushVersion(versionState, regionId, region.prompt, region.generatedHtml, region.createdAt);
      state.nextVersionId := versionState.nextVersionId;
    };
    region.prompt := newPrompt;
    region.generatedHtml := "";
    region.status := #pending;
    region.updatedAt := now();
    getRegionView(region);
  };

  public func deleteRegion(regions : Map.Map<Types.RegionId, GeneratedRegion>, regionId : Types.RegionId) : () {
    regions.remove(regionId);
  };
};
