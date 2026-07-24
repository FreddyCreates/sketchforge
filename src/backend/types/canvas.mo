import Common "common";

module {
  public type ProjectId = Common.ProjectId;
  public type TabId = Common.TabId;
  public type StrokeId = Common.StrokeId;
  public type CommentId = Common.CommentId;
  public type RegionId = Common.RegionId;
  public type Timestamp = Common.Timestamp;
  public type Point = Common.Point;
  public type Tool = Common.Tool;
  public type RegionStatus = Common.RegionStatus;

  // The single shared project for the MVP. Name is editable from the header.
  public type Project = {
    id : ProjectId;
    var name : Text;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // An independent canvas page. `order` defines tab ordering in the header.
  public type Tab = {
    id : TabId;
    var projectId : ProjectId;
    var name : Text;
    var order : Nat;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // A persisted freehand stroke. `points` is the polyline drawn with `tool`.
  public type Stroke = {
    id : StrokeId;
    var tabId : TabId;
    var points : [Point];
    var color : Text;
    var size : Float;
    var tool : Tool;
    var createdAt : Timestamp;
  };

  // A reply within a comment thread.
  public type Reply = {
    var author : Text;
    var text : Text;
    var createdAt : Timestamp;
  };

  // A numbered pin anchored to a canvas point, with a reply thread.
  public type Comment = {
    id : CommentId;
    var tabId : TabId;
    var x : Float;
    var y : Float;
    var author : Text;
    var text : Text;
    var createdAt : Timestamp;
    var replies : [Reply];
  };

  // A circled region that triggered AI generation. The rendered live web
  // output is stored in `generatedHtml` once `status` reaches #done.
  public type GeneratedRegion = {
    id : RegionId;
    var tabId : TabId;
    var x : Float;
    var y : Float;
    var width : Float;
    var height : Float;
    var prompt : Text;
    var generatedHtml : Text;
    var status : RegionStatus;
    var createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Shared (Candid-serialisable) projections of the mutable internal types,
  // used at the public API boundary. Internal state uses `var` fields for
  // in-place updates; the API returns these immutable snapshots.
  public type ProjectView = {
    id : ProjectId;
    name : Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type TabView = {
    id : TabId;
    projectId : ProjectId;
    name : Text;
    order : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type StrokeView = {
    id : StrokeId;
    tabId : TabId;
    points : [Point];
    color : Text;
    size : Float;
    tool : Tool;
    createdAt : Timestamp;
  };

  public type ReplyView = {
    author : Text;
    text : Text;
    createdAt : Timestamp;
  };

  public type CommentView = {
    id : CommentId;
    tabId : TabId;
    x : Float;
    y : Float;
    author : Text;
    text : Text;
    createdAt : Timestamp;
    replies : [ReplyView];
  };

  public type GeneratedRegionView = {
    id : RegionId;
    tabId : TabId;
    x : Float;
    y : Float;
    width : Float;
    height : Float;
    prompt : Text;
    generatedHtml : Text;
    status : RegionStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Input shapes for create/update operations.
  public type StrokeInput = {
    points : [Point];
    color : Text;
    size : Float;
    tool : Tool;
  };

  public type CommentInput = {
    x : Float;
    y : Float;
    author : Text;
    text : Text;
  };

  public type ReplyInput = {
    author : Text;
    text : Text;
  };

  public type RegionInput = {
    x : Float;
    y : Float;
    width : Float;
    height : Float;
    prompt : Text;
  };

  public type RegionUpdate = {
    x : ?Float;
    y : ?Float;
    width : ?Float;
    height : ?Float;
    prompt : ?Text;
    generatedHtml : ?Text;
    status : ?RegionStatus;
  };
};
