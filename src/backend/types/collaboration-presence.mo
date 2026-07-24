import Common "common";

module {
  public type TabId = Common.TabId;
  public type Timestamp = Common.Timestamp;

  // A collaborator's principal, stored as Text for Candid safety (Principal
  // round-trips cleanly as Text and avoids cross-version Principal subtyping
  // concerns in the migration chain).
  public type PrincipalText = Text;

  // Internal mutable presence record. Keyed by the collaborator's principal
  // (as Text) in the presence Map. `lastSeen` is updated on every heartbeat /
  // upsert so the roster query can drop stale entries.
  public type Presence = {
    var principal : PrincipalText;
    var displayName : Text;
    var color : Text;
    var cursorX : Float;
    var cursorY : Float;
    var activeTool : Text;
    var lastSeen : Timestamp;
    var activeTabId : TabId;
  };

  // Shared (Candid-serialisable) immutable projection of Presence, returned at
  // the public API boundary.
  public type PresenceView = {
    principal : PrincipalText;
    displayName : Text;
    color : Text;
    cursorX : Float;
    cursorY : Float;
    activeTool : Text;
    lastSeen : Timestamp;
    activeTabId : TabId;
  };

  // Input shape for an upsertPresence call. The caller's principal is taken
  // from the message context, not from this record, so it is not included.
  public type PresenceInput = {
    displayName : Text;
    color : Text;
    cursorX : Float;
    cursorY : Float;
    activeTool : Text;
    activeTabId : TabId;
  };
};
