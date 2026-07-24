import Types "../types/template-library";
import CanvasTypes "../types/canvas";
import CanvasLib "../lib/canvas";
import TemplateLib "../lib/template-library";

// Public API surface for the template-library domain. Each function delegates
// to the domain logic in lib/template-library.mo. The mixin receives the
// shared CanvasState (for region creation) and the TemplateLibraryState slice
// (for template reads). insertTemplate spawns a new GeneratedRegion with the
// template's html pre-filled and status=#done via CanvasLib.createRegionWithHtml.
//
// Per-user edit locking is intentionally NOT implemented (excluded by contract).
mixin (state : CanvasLib.CanvasState, templates : TemplateLib.TemplateLibraryState) {

  // ---- Templates ----
  public query func listTemplates() : async [Types.TemplateView] {
    TemplateLib.listTemplateViews(templates.templates);
  };

  public query func searchTemplates(queryText : Text) : async [Types.TemplateView] {
    TemplateLib.searchTemplateViews(templates.templates, queryText);
  };

  public shared ({ caller }) func insertTemplate(tabId : CanvasTypes.TabId, templateId : Types.TemplateId, x : Float, y : Float, width : Float, height : Float) : async ?CanvasTypes.GeneratedRegionView {
    ignore caller;
    // Only insert if the target tab exists.
    switch (state.tabs.get(tabId)) {
      case (?_tab) {
        TemplateLib.insertTemplateAsRegion(
          templates.templates,
          templateId,
          tabId,
          x,
          y,
          width,
          height,
          func(t : CanvasTypes.TabId, xx : Float, yy : Float, w : Float, h : Float, prompt : Text, html : Text) : CanvasTypes.GeneratedRegionView {
            CanvasLib.createRegionWithHtml(state, t, xx, yy, w, h, prompt, html);
          },
        );
      };
      case null null;
    };
  };
};
