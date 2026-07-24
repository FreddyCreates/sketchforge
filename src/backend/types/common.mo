module {
  // Cross-cutting identifiers and primitives shared across the canvas domain.
  // All IDs are Nat so they serialise cleanly through Candid and OQL.

  public type ProjectId = Nat;
  public type TabId = Nat;
  public type StrokeId = Nat;
  public type CommentId = Nat;
  public type RegionId = Nat;

  // Nanoseconds since epoch (Time.now() returns Int, but we store Nat for
  // stable-friendly OQL columns).
  public type Timestamp = Nat;

  // A single point on the infinite canvas, in canvas (world) coordinates.
  public type Point = { x : Float; y : Float };

  // Drawing tool selector for a stroke.
  public type Tool = { #pen; #eraser };

  // Lifecycle of an AI-generated region.
  public type RegionStatus = { #pending; #generating; #done; #error };
};
