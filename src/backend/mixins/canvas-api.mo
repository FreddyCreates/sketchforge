import Types "../types/canvas";
import CanvasLib "../lib/canvas";

// Public API surface for the canvas domain. Each function delegates to the
// domain logic in lib/canvas.mo. The mixin receives the shared CanvasState
// record so every endpoint reads/writes the same storage.
//
// MVP semantics: a single shared project. getProject lazily creates the
// default project on first access; updateProjectName does the same before
// renaming. All other endpoints operate on the project's tabs.
mixin (state : CanvasLib.CanvasState) {

  // Lazily ensure the single shared project exists and return its internal
  // record. Idempotent: returns the existing project if one is present.
  func ensureProject() : CanvasLib.Project {
    switch (state.project.get(0)) {
      case (?p) p;
      case null {
        let id = state.nextProjectId;
        state.nextProjectId := id + 1;
        let ts = CanvasLib.now();
        let project : CanvasLib.Project = {
          id;
          var name = "Untitled Project";
          var createdAt = ts;
          var updatedAt = ts;
        };
        state.project.add(id, project);
        project;
      };
    };
  };

  // ---- Project ----
  // Update method (not query): ensureProject() mutates stable state, which
  // IC query calls cannot persist. Using a shared/update method guarantees
  // the lazy project init survives across replicas/refresh.
  public shared func getProject() : async ?Types.ProjectView {
    ?ensureProject().getProjectView();
  };

  public shared ({ caller }) func updateProjectName(name : Text) : async ?Types.ProjectView {
    ignore caller;
    ?ensureProject().updateProjectName(name);
  };

  // ---- Tabs ----
  public query func getTabs(projectId : Types.ProjectId) : async [Types.TabView] {
    CanvasLib.listTabViews(state.tabs, projectId);
  };

  public shared ({ caller }) func createTab(projectId : Types.ProjectId, name : Text) : async ?Types.TabView {
    ignore caller;
    ?CanvasLib.createTab(state, projectId, name);
  };

  public shared ({ caller }) func renameTab(tabId : Types.TabId, name : Text) : async ?Types.TabView {
    ignore caller;
    switch (state.tabs.get(tabId)) {
      case (?tab) ?tab.renameTab(name);
      case null null;
    };
  };

  public shared ({ caller }) func reorderTabs(projectId : Types.ProjectId, tabIds : [Types.TabId]) : async [Types.TabView] {
    ignore caller;
    CanvasLib.reorderTabs(state.tabs, projectId, tabIds);
  };

  public shared ({ caller }) func deleteTab(tabId : Types.TabId) : async ?Bool {
    ignore caller;
    switch (state.tabs.get(tabId)) {
      case (?_tab) {
        CanvasLib.deleteTab(state, tabId);
        ?true;
      };
      case null null;
    };
  };

  // ---- Strokes ----
  public query func getStrokes(tabId : Types.TabId) : async [Types.StrokeView] {
    CanvasLib.listStrokeViews(state.strokes, tabId);
  };

  public shared ({ caller }) func addStroke(tabId : Types.TabId, stroke : Types.StrokeInput) : async ?Types.StrokeView {
    ignore caller;
    // Only add a stroke if the target tab exists.
    switch (state.tabs.get(tabId)) {
      case (?_tab) ?CanvasLib.addStroke(state, tabId, stroke);
      case null null;
    };
  };

  public shared ({ caller }) func deleteStroke(strokeId : Types.StrokeId) : async ?Bool {
    ignore caller;
    switch (state.strokes.get(strokeId)) {
      case (?_s) {
        CanvasLib.deleteStroke(state.strokes, strokeId);
        ?true;
      };
      case null null;
    };
  };

  public shared ({ caller }) func undoLastStroke(tabId : Types.TabId) : async ?Types.StrokeView {
    ignore caller;
    CanvasLib.undoLastStroke(state, tabId);
  };

  // ---- Comments ----
  public query func getComments(tabId : Types.TabId) : async [Types.CommentView] {
    CanvasLib.listCommentViews(state.comments, tabId);
  };

  public shared ({ caller }) func addComment(tabId : Types.TabId, comment : Types.CommentInput) : async ?Types.CommentView {
    ignore caller;
    switch (state.tabs.get(tabId)) {
      case (?_tab) ?CanvasLib.addComment(state, tabId, comment);
      case null null;
    };
  };

  public shared ({ caller }) func addReply(commentId : Types.CommentId, reply : Types.ReplyInput) : async ?Types.CommentView {
    ignore caller;
    switch (state.comments.get(commentId)) {
      case (?_c) ?CanvasLib.addReply(state.comments, commentId, reply);
      case null null;
    };
  };

  public shared ({ caller }) func deleteComment(commentId : Types.CommentId) : async ?Bool {
    ignore caller;
    switch (state.comments.get(commentId)) {
      case (?_c) {
        CanvasLib.deleteComment(state.comments, commentId);
        ?true;
      };
      case null null;
    };
  };

  // ---- Generated regions ----
  public query func getRegions(tabId : Types.TabId) : async [Types.GeneratedRegionView] {
    CanvasLib.listRegionViews(state.regions, tabId);
  };

  public shared ({ caller }) func createRegion(tabId : Types.TabId, region : Types.RegionInput) : async ?Types.GeneratedRegionView {
    ignore caller;
    switch (state.tabs.get(tabId)) {
      case (?_tab) ?CanvasLib.createRegion(state, tabId, region);
      case null null;
    };
  };

  public shared ({ caller }) func updateRegion(regionId : Types.RegionId, updates : Types.RegionUpdate) : async ?Types.GeneratedRegionView {
    ignore caller;
    switch (state.regions.get(regionId)) {
      case (?_r) ?CanvasLib.updateRegion(state.regions, regionId, updates);
      case null null;
    };
  };

  public shared ({ caller }) func regenerateRegion(regionId : Types.RegionId, newPrompt : Text) : async ?Types.GeneratedRegionView {
    ignore caller;
    switch (state.regions.get(regionId)) {
      case (?_r) ?CanvasLib.regenerateRegion(state, state.regions, regionId, newPrompt);
      case null null;
    };
  };

  public shared ({ caller }) func deleteRegion(regionId : Types.RegionId) : async ?Bool {
    ignore caller;
    switch (state.regions.get(regionId)) {
      case (?_r) {
        CanvasLib.deleteRegion(state.regions, regionId);
        ?true;
      };
      case null null;
    };
  };
};
