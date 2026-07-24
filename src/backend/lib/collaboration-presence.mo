import Map "mo:core/Map";
import Types "../types/collaboration-presence";

// Domain logic for real-time multi-user collaboration presence. Stateless
// module — storage is injected by the mixin layer. Presence is keyed by the
// collaborator's principal (as Text) so each signed-in user has exactly one
// presence record that is overwritten on every heartbeat / upsert.
module {
  public type Presence = Types.Presence;
  public type PresenceView = Types.PresenceView;
  public type PresenceInput = Types.PresenceInput;
  public type PrincipalText = Types.PrincipalText;

  // Storage shape for the presence domain. The presence Map is keyed by the
  // collaborator's principal (as Text); `nextPresenceId` is a monotonic
  // counter reserved for future per-heartbeat sequencing / OQL row identity.
  public type PresenceState = {
    var presence : Map.Map<PrincipalText, Presence>;
    var nextPresenceId : Nat;
  };

  // Stale-entry cutoff for the roster query: ~30 seconds, in nanoseconds
  // (Timestamp is nanoseconds since epoch, matching Time.now()).
  public let staleCutoffNs : Nat = 30_000_000_000;

  public func getPresenceView(self : Presence) : PresenceView {
    {
      principal = self.principal;
      displayName = self.displayName;
      color = self.color;
      cursorX = self.cursorX;
      cursorY = self.cursorY;
      activeTool = self.activeTool;
      lastSeen = self.lastSeen;
      activeTabId = self.activeTabId;
    };
  };

  // Upsert the caller's presence record. If a record for this principal
  // already exists, overwrite its mutable fields in place; otherwise create a
  // new record and add it to the map. `nowNs` is the canister's current clock
  // (nanoseconds), used to stamp `lastSeen` so the roster query can drop
  // stale entries. Bumps nextPresenceId on each call.
  public func upsertPresence(state : PresenceState, principal : PrincipalText, nowNs : Types.Timestamp, input : PresenceInput) : PresenceView {
    let id = state.nextPresenceId;
    state.nextPresenceId := id + 1;
    switch (state.presence.get(principal)) {
      case (?p) {
        p.displayName := input.displayName;
        p.color := input.color;
        p.cursorX := input.cursorX;
        p.cursorY := input.cursorY;
        p.activeTool := input.activeTool;
        p.lastSeen := nowNs;
        p.activeTabId := input.activeTabId;
        getPresenceView(p);
      };
      case null {
        let p : Presence = {
          var principal;
          var displayName = input.displayName;
          var color = input.color;
          var cursorX = input.cursorX;
          var cursorY = input.cursorY;
          var activeTool = input.activeTool;
          var lastSeen = nowNs;
          var activeTabId = input.activeTabId;
        };
        state.presence.add(principal, p);
        getPresenceView(p);
      };
    };
  };

  // Return all presence records whose lastSeen is within staleCutoffNs of
  // nowNs (i.e. not stale). Stale entries are filtered out of the roster but
  // are NOT removed from the map — a later heartbeat from the same principal
  // will simply overwrite the existing record.
  public func listPresenceViews(state : PresenceState, nowNs : Types.Timestamp) : [PresenceView] {
    let cutoff : Int = nowNs - staleCutoffNs;
    let matching = state.presence.filter(func(_key : PrincipalText, p : Presence) : Bool {
      // Timestamp is Nat; compare as Int to handle the (unlikely) underflow
      // when nowNs < staleCutoffNs at boot.
      p.lastSeen >= cutoff;
    });
    let pairs = matching.toArray();
    pairs.map(func(p : (PrincipalText, Presence)) : PresenceView { getPresenceView(p.1) });
  };
};
