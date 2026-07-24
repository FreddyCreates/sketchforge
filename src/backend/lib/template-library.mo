import Map "mo:core/Map";
import Text "mo:core/Text";
import Types "../types/template-library";
import CanvasTypes "../types/canvas";

// Domain logic for the template-library domain. Stateless module — storage is
// injected by the mixin layer. Templates are keyed by TemplateId; the curated
// seed set is populated by the migration chain.
module {
  public type Template = Types.Template;
  public type TemplateView = Types.TemplateView;
  public type TemplateId = Types.TemplateId;

  // Storage shape for the template-library domain, injected from main.mo.
  // Kept as a separate state slice so the template-library mixin owns only its
  // own collections; the canvas mixin continues to own regions/tabs/etc.
  public type TemplateLibraryState = {
    var templates : Map.Map<TemplateId, Template>;
    var nextTemplateId : Nat;
  };

  public func getTemplateView(self : Template) : TemplateView {
    {
      id = self.id;
      name = self.name;
      description = self.description;
      category = self.category;
      html = self.html;
    };
  };

  // List all templates, ordered by id (insertion order from the seed migration).
  public func listTemplateViews(templates : Map.Map<TemplateId, Template>) : [TemplateView] {
    let pairs = templates.toArray();
    let views = pairs.map(func(p : (TemplateId, Template)) : TemplateView { getTemplateView(p.1) });
    views.sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  // Search templates by case-insensitive substring match against name,
  // description, or category. Returns matching views ordered by id.
  public func searchTemplateViews(templates : Map.Map<TemplateId, Template>, queryText : Text) : [TemplateView] {
    let q = queryText.toLower();
    let matching = templates.filter(func(_id : TemplateId, t : Template) : Bool {
      t.name.toLower().contains(#text q) or t.description.toLower().contains(#text q) or t.category.toLower().contains(#text q);
    });
    let pairs = matching.toArray();
    let views = pairs.map(func(p : (TemplateId, Template)) : TemplateView { getTemplateView(p.1) });
    views.sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  // Insert a template as a new generated region on the canvas: creates a new
  // GeneratedRegion with the template's html pre-filled, status=#done, and the
  // prompt set to the template name. Delegates region creation to the canvas
  // domain via the injected region-creation callback so this module stays
  // decoupled from CanvasState internals.
  //
  // The createRegion callback signature is
  //   (tabId, x, y, width, height, prompt, generatedHtml) -> GeneratedRegionView
  // so the canvas domain can build a region with both prompt and html set in
  // one step (the standard createRegion only takes a prompt and leaves html
  // empty / status #pending). Returns null if the template does not exist.
  public func insertTemplateAsRegion(
    templates : Map.Map<TemplateId, Template>,
    templateId : TemplateId,
    tabId : CanvasTypes.TabId,
    x : Float,
    y : Float,
    width : Float,
    height : Float,
    createRegion : (CanvasTypes.TabId, Float, Float, Float, Float, Text, Text) -> CanvasTypes.GeneratedRegionView,
  ) : ?CanvasTypes.GeneratedRegionView {
    switch (templates.get(templateId)) {
      case (?t) {
        ?createRegion(tabId, x, y, width, height, t.name, t.html);
      };
      case null null;
    };
  };
};
