import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/collaboration-presence";
import PresenceLib "../lib/collaboration-presence";

// Public API surface for the collaboration-presence domain. Each function
// delegates to the domain logic in lib/collaboration-presence.mo. The mixin
// receives the shared PresenceState record so endpoints read/write the same
// storage.
//
// Presence writes go through an UPDATE method (upsertPresence) so the
// heartbeat / cursor update persists in stable state across replica refresh.
// The roster read is a QUERY method (getPresence) that filters out stale
// entries older than ~30 seconds before returning.
mixin (state : PresenceLib.PresenceState) {

  // Update method: writes the caller's presence record (heartbeat / cursor /
  // active tool). The caller's principal is taken from the message context
  // and used as the presence key, so a signed-in collaborator has exactly one
  // record that is overwritten on each call.
  public shared ({ caller }) func upsertPresence(presence : Types.PresenceInput) : async Types.PresenceView {
    let principalText = caller.toText();
    PresenceLib.upsertPresence(state, principalText, absNs(), presence);
  };

  // Query method: returns all active presence records, excluding stale entries
  // whose lastSeen is older than ~30 seconds relative to the canister's
  // current clock.
  public query func getPresence() : async [Types.PresenceView] {
    PresenceLib.listPresenceViews(state, absNs());
  };

  // Helper: current canister clock as Nat nanoseconds. Time.now() returns Int;
  // Timestamp is Nat. Kept private to this mixin.
  func absNs() : Types.Timestamp {
    let nowInt = Time.now();
    if (nowInt >= 0) { Int.abs(nowInt) } else { 0 };
  };
};
