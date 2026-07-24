import Types "../types/version-history";
import CanvasTypes "../types/canvas";
import CanvasLib "../lib/canvas";
import VersionLib "../lib/version-history";

// Public API surface for the region version-history domain. Each function
// delegates to the domain logic in lib/version-history.mo. The mixin
// receives the shared CanvasState record so it can read the regions map
// and the version-history storage slice.
//
// Per-user edit locking is intentionally NOT implemented (excluded by the
// dispatch contract). Version history is append-only on regenerate and
// read-only on list/preview; restoreRegionVersion overwrites the region's
// current {prompt, generatedHtml, status} in place.
mixin (state : CanvasLib.CanvasState) {

  // Query: list all version snapshots for a region, newest-first.
  public query func listRegionVersions(regionId : CanvasTypes.RegionId) : async [Types.RegionVersionView] {
    VersionLib.listRegionVersions(state.versions, regionId);
  };

  // Update: restore a region's current {prompt, generatedHtml} from a prior
  // version snapshot and set status to #done. Returns the updated region
  // view, or null if the region or version does not exist.
  public shared ({ caller }) func restoreRegionVersion(regionId : CanvasTypes.RegionId, versionId : Nat) : async ?CanvasTypes.GeneratedRegionView {
    ignore caller;
    // Both the region and the version must exist.
    let region = switch (state.regions.get(regionId)) {
      case (?r) r;
      case null return null;
    };
    let version = switch (VersionLib.getVersion(state.versions, versionId)) {
      case (?v) v;
      case null return null;
    };
    // The version must belong to this region.
    if (version.regionId != regionId) {
      return null;
    };
    region.prompt := version.prompt;
    region.generatedHtml := version.generatedHtml;
    region.status := #done;
    region.updatedAt := CanvasLib.now();
    ?region.getRegionView();
  };
};
