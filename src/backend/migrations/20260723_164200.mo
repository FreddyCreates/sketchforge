import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  // Init migration: introduces stable state for the canvas app for the first
  // time. OldActor is {} (fresh install); NewActor enumerates every stable
  // field declared in main.mo and supplies its initial value.
  //
  // main.mo declares exactly two stable fields:
  //   - state            : CanvasLib.CanvasState (a single record wrapping all
  //                        Maps and id counters, shared by reference with mixins)
  //   - accessControlState : AccessControl.AccessControlState
  //
  // Self-contained: only mo:core + authorization imports, actor shapes inlined.

  // Old actor shape — empty (no prior deployed version).
  type OldActor = {};

  // New actor shape — must match the stable fields declared in main.mo.
  // Mutable wrappers (var) are used because main.mo declares them as `let` of
  // mutable record types (the record fields themselves are `var`).
  type Project = {
    id : Nat;
    var name : Text;
    var createdAt : Nat;
    var updatedAt : Nat;
  };
  type Tab = {
    id : Nat;
    var projectId : Nat;
    var name : Text;
    var order : Nat;
    var createdAt : Nat;
    var updatedAt : Nat;
  };
  type Point = { x : Float; y : Float };
  type Stroke = {
    id : Nat;
    var tabId : Nat;
    var points : [Point];
    var color : Text;
    var size : Float;
    var tool : { #pen; #eraser };
    var createdAt : Nat;
  };
  type Reply = { var author : Text; var text : Text; var createdAt : Nat };
  type Comment = {
    id : Nat;
    var tabId : Nat;
    var x : Float;
    var y : Float;
    var author : Text;
    var text : Text;
    var createdAt : Nat;
    var replies : [Reply];
  };
  type GeneratedRegion = {
    id : Nat;
    var tabId : Nat;
    var x : Float;
    var y : Float;
    var width : Float;
    var height : Float;
    var prompt : Text;
    var generatedHtml : Text;
    var status : { #pending; #generating; #done; #error };
    var createdAt : Nat;
    var updatedAt : Nat;
  };

  type CanvasState = {
    var project : Map.Map<Nat, Project>;
    var tabs : Map.Map<Nat, Tab>;
    var strokes : Map.Map<Nat, Stroke>;
    var comments : Map.Map<Nat, Comment>;
    var regions : Map.Map<Nat, GeneratedRegion>;
    var nextProjectId : Nat;
    var nextTabId : Nat;
    var nextStrokeId : Nat;
    var nextCommentId : Nat;
    var nextRegionId : Nat;
  };

  type NewActor = {
    var state : CanvasState;
    var accessControlState : AccessControl.AccessControlState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      var state = {
        var project = Map.empty();
        var tabs = Map.empty();
        var strokes = Map.empty();
        var comments = Map.empty();
        var regions = Map.empty();
        var nextProjectId = 0;
        var nextTabId = 0;
        var nextStrokeId = 0;
        var nextCommentId = 0;
        var nextRegionId = 0;
      };
      var accessControlState = AccessControl.initState();
    };
  };
};
