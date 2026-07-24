import Common "common";

module {
  public type TemplateId = Nat;
  public type Timestamp = Common.Timestamp;

  // A curated, named HTML template the AI generator can reason from and the
  // user can drop onto the canvas. `html` is the full standalone HTML for the
  // template (sketchy aesthetic). `category` is a short tag used for browsing
  // and search (e.g. "hero", "pricing", "cta").
  public type Template = {
    id : TemplateId;
    var name : Text;
    var description : Text;
    var category : Text;
    var html : Text;
  };

  // Immutable Candid-serialisable projection of the mutable internal Template,
  // used at the public API boundary.
  public type TemplateView = {
    id : TemplateId;
    name : Text;
    description : Text;
    category : Text;
    html : Text;
  };
};
