import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/version-history";
import CanvasTypes "../types/canvas";

// Domain logic for region version history. Stateless module — storage is
// injected from the mixin layer via the shared CanvasState record.
//
// Each regenerateRegion call pushes a snapshot of the region's current
// {prompt, generatedHtml, createdAt} into the versions map before the
// region is overwritten. Versions are keyed by a monotonic versionId and
// listed newest-first.
module {
  public type RegionVersion = Types.RegionVersion;
  public type RegionVersionView = Types.RegionVersionView;

  // Storage slice for version history. The versions map is keyed by the
  // monotonic versionId; nextVersionId is the next id to allocate. This
  // slice is added to CanvasState in lib/canvas.mo and initialized by the
  // migration chain.
  public type VersionState = {
    var versions : Map.Map<Nat, RegionVersion>;
    var nextVersionId : Nat;
  };

  public func getRegionVersionView(self : RegionVersion) : RegionVersionView {
    {
      versionId = self.versionId;
      regionId = self.regionId;
      prompt = self.prompt;
      generatedHtml = self.generatedHtml;
      createdAt = self.createdAt;
    };
  };

  // List all version snapshots for a given region, newest-first (highest
  // versionId first). versionId is monotonic by allocation order, so sorting
  // descending by versionId yields newest-first.
  public func listRegionVersions(versions : Map.Map<Nat, RegionVersion>, regionId : CanvasTypes.RegionId) : [RegionVersionView] {
    let matching = versions.filter(func(_id : Nat, v : RegionVersion) : Bool {
      v.regionId == regionId;
    });
    let pairs = matching.toArray();
    let views = pairs.map(func(p : (Nat, RegionVersion)) : RegionVersionView { getRegionVersionView(p.1) });
    views.sort(func(a, b) = Nat.compare(b.versionId, a.versionId));
  };

  // Push a snapshot of the region's current {prompt, generatedHtml, createdAt}
  // into the versions map, keyed by a fresh versionId. Returns the created
  // snapshot. Called by regenerateRegion BEFORE overwriting the region.
  public func pushVersion(state : VersionState, regionId : CanvasTypes.RegionId, prompt : Text, generatedHtml : Text, createdAt : CanvasTypes.Timestamp) : RegionVersion {
    let versionId = state.nextVersionId;
    state.nextVersionId := versionId + 1;
    let v : RegionVersion = {
      versionId;
      regionId;
      prompt;
      generatedHtml;
      createdAt;
    };
    state.versions.add(versionId, v);
    v;
  };

  // Look up a specific version snapshot by versionId. Returns null if no
  // version with that id exists.
  public func getVersion(versions : Map.Map<Nat, RegionVersion>, versionId : Nat) : ?RegionVersion {
    versions.get(versionId);
  };
};
