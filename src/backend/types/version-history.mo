import Common "common";

module {
  public type RegionId = Common.RegionId;
  public type Timestamp = Common.Timestamp;

  // A snapshot of a generated region's content at the moment it was
  // superseded by a regeneration. Each regenerateRegion call pushes one
  // RegionVersion capturing the prior {prompt, generatedHtml, createdAt}
  // before the region is overwritten. Versions are keyed by a monotonic
  // versionId and ordered newest-first when listed.
  public type RegionVersion = {
    versionId : Nat;
    regionId : RegionId;
    prompt : Text;
    generatedHtml : Text;
    createdAt : Timestamp;
  };

  // Immutable Candid projection of RegionVersion for the public API boundary.
  // RegionVersion has no `var` fields, so the projection is structurally
  // identical, but kept as a distinct named type for clarity at the API edge.
  public type RegionVersionView = {
    versionId : Nat;
    regionId : RegionId;
    prompt : Text;
    generatedHtml : Text;
    createdAt : Timestamp;
  };
};
