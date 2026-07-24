import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  // Adds region version-history, real-time collaboration presence, and the
  // curated template library to CanvasState.
  //
  // The preceding migration (20260723_164200.mo) introduced the canvas state
  // without these slices. This one:
  //   - adds `versions` + `nextVersionId` (version history)
  //   - adds `presence` + `nextPresenceId` (real-time collaboration)
  //   - adds `templates` + `nextTemplateId` (template library) and seeds
  //     6 curated sketchy-aesthetic templates (hero section, pricing card,
  //     feature grid, testimonial block, CTA banner, navbar).
  //
  // OldActor mirrors the NewActor of 20260723_164200.mo exactly (the
  // previously deployed stable signature — no versions/presence/templates).
  // NewActor adds the new CanvasState fields and initializes them.
  //
  // Self-contained: only mo:core + authorization imports, actor shapes
  // inlined.

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
  type RegionVersion = {
    versionId : Nat;
    regionId : Nat;
    prompt : Text;
    generatedHtml : Text;
    createdAt : Nat;
  };
  type Presence = {
    var principal : Text;
    var displayName : Text;
    var color : Text;
    var cursorX : Float;
    var cursorY : Float;
    var activeTool : Text;
    var lastSeen : Nat;
    var activeTabId : Nat;
  };
  type Template = {
    id : Nat;
    var name : Text;
    var description : Text;
    var category : Text;
    var html : Text;
  };

  // Old CanvasState — matches the NewActor of the preceding migration
  // (20260723_164200.mo): no versions, presence, or templates.
  type OldCanvasState = {
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

  // New CanvasState — adds versions + presence + templates maps and their
  // id counters.
  type NewCanvasState = {
    var project : Map.Map<Nat, Project>;
    var tabs : Map.Map<Nat, Tab>;
    var strokes : Map.Map<Nat, Stroke>;
    var comments : Map.Map<Nat, Comment>;
    var regions : Map.Map<Nat, GeneratedRegion>;
    var versions : Map.Map<Nat, RegionVersion>;
    var presence : Map.Map<Text, Presence>;
    var templates : Map.Map<Nat, Template>;
    var nextProjectId : Nat;
    var nextTabId : Nat;
    var nextStrokeId : Nat;
    var nextCommentId : Nat;
    var nextRegionId : Nat;
    var nextVersionId : Nat;
    var nextPresenceId : Nat;
    var nextTemplateId : Nat;
  };

  type OldActor = {
    var state : OldCanvasState;
    var accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    var state : NewCanvasState;
    var accessControlState : AccessControl.AccessControlState;
  };

  // Seed the template library with 6 curated sketchy-aesthetic templates.
  // Each `html` is full standalone HTML in the sketchy/hand-drawn style
  // (white canvas, rounded pill buttons, hand-drawn borders via inline SVG
  // filter, blue/purple accent). The AI generator can reason from these
  // and the user can drop any onto the canvas as a finished region.
  func seedTemplates() : Map.Map<Nat, Template> {
    let m = Map.empty<Nat, Template>();

    // 1. Hero section
    m.add(0, {
      id = 0;
      var name = "Hero Section";
      var description = "Bold headline + subhead + dual CTA, sketchy hand-drawn frame";
      var category = "hero";
      var html = "<section style=\"font-family:'Comic Sans MS','Segoe Print',cursive;padding:64px 32px;text-align:center;background:#fff;border:3px solid #1f2937;border-radius:24px;max-width:760px;margin:24px auto;box-shadow:6px 6px 0 #6366f1;position:relative\"><svg width=\"0\" height=\"0\"><filter id=\"sketch0\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.02\" numOctaves=\"3\"/><feDisplacementMap in=\"SourceGraphic\" scale=\"2.5\"/></filter></svg><h1 style=\"filter:url(#sketch0);font-size:48px;color:#1f2937;margin:0 0 12px;letter-spacing:-1px\">Sketch the Future</h1><p style=\"filter:url(#sketch0);font-size:20px;color:#4b5563;margin:0 0 28px\">A hand-drawn canvas for ideas that ship.</p><div style=\"display:flex;gap:12px;justify-content:center;flex-wrap:wrap\"><a href=\"#\" style=\"background:#6366f1;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;border:2px solid #1f2937;box-shadow:3px 3px 0 #1f2937\">Get Started</a><a href=\"#\" style=\"background:#fff;color:#1f2937;padding:12px 28px;border-radius:999px;text-decoration:none;border:2px solid #1f2937;box-shadow:3px 3px 0 #1f2937\">Live Demo</a></div></section>";
    });

    // 2. Pricing card
    m.add(1, {
      id = 1;
      var name = "Pricing Card";
      var description = "Single plan card with price, features list, CTA button";
      var category = "pricing";
      var html = "<div style=\"font-family:'Comic Sans MS','Segoe Print',cursive;width:280px;padding:32px 24px;background:#fff;border:3px solid #1f2937;border-radius:20px;box-shadow:6px 6px 0 #8b5cf6;margin:24px auto;text-align:center\"><h3 style=\"margin:0 0 8px;color:#1f2937\">Pro</h3><div style=\"font-size:42px;font-weight:bold;color:#6366f1;margin:0 0 4px\">$19<span style=\"font-size:16px;color:#6b7280;font-weight:normal\">/mo</span></div><p style=\"color:#6b7280;font-size:14px;margin:0 0 20px\">For makers who ship</p><ul style=\"list-style:none;padding:0;margin:0 0 24px;text-align:left;color:#374151;font-size:15px;line-height:2\">&nbsp;&nbsp;✓ Unlimited canvases</li><li>✓ Real-time collab</li><li>✓ Version history</li><li>✓ Template library</li></ul><a href=\"#\" style=\"display:block;background:#6366f1;color:#fff;padding:12px;border-radius:999px;text-decoration:none;border:2px solid #1f2937;box-shadow:3px 3px 0 #1f2937\">Choose Pro</a></div>";
    });

    // 3. Feature grid
    m.add(2, {
      id = 2;
      var name = "Feature Grid";
      var description = "3-column grid of icon + title + description features";
      var category = "feature";
      var html = "<div style=\"font-family:'Comic Sans MS','Segoe Print',cursive;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:24px auto;padding:0 16px\"><div style=\"background:#fff;border:3px solid #1f2937;border-radius:16px;padding:24px;box-shadow:4px 4px 0 #6366f1\"><div style=\"font-size:32px\">✏️</div><h4 style=\"margin:8px 0;color:#1f2937\">Draw</h4><p style=\"margin:0;color:#6b7280;font-size:14px\">Freehand sketch on an infinite canvas.</p></div><div style=\"background:#fff;border:3px solid #1f2937;border-radius:16px;padding:24px;box-shadow:4px 4px 0 #8b5cf6\"><div style=\"font-size:32px\">🤖</div><h4 style=\"margin:8px 0;color:#1f2937\">Generate</h4><p style=\"margin:0;color:#6b7280;font-size:14px\">AI turns your prompt into live UI.</p></div><div style=\"background:#fff;border:3px solid #1f2937;border-radius:16px;padding:24px;box-shadow:4px 4px 0 #ec4899\"><div style=\"font-size:32px\">👥</div><h4 style=\"margin:8px 0;color:#1f2937\">Collaborate</h4><p style=\"margin:0;color:#6b7280;font-size:14px\">See cursors and edits in real time.</p></div></div>";
    });

    // 4. Testimonial block
    m.add(3, {
      id = 3;
      var name = "Testimonial Block";
      var description = "Quote + author + role, hand-drawn quotation accent";
      var category = "testimonial";
      var html = "<blockquote style=\"font-family:'Comic Sans MS','Segoe Print',cursive;max-width:640px;margin:24px auto;padding:32px;background:#fff;border:3px solid #1f2937;border-radius:20px;box-shadow:6px 6px 0 #6366f1;position:relative\"><span style=\"position:absolute;top:-20px;left:24px;font-size:64px;color:#8b5cf6;line-height:1\">“</span><p style=\"font-size:20px;color:#1f2937;margin:0 0 16px;line-height:1.5\">This is the fastest way I've ever gone from a napkin sketch to a working interface. It feels like drawing, but it ships like code.</p><footer style=\"display:flex;align-items:center;gap:12px\"><div style=\"width:44px;height:44px;border-radius:50%;background:#ede9fe;border:2px solid #1f2937;display:flex;align-items:center;justify-content:center;font-size:20px\">🎨</div><div><div style=\"font-weight:bold;color:#1f2937\">Maya Lin</div><div style=\"color:#6b7280;font-size:13px\">Product Designer, Doodle Labs</div></div></footer></blockquote>";
    });

    // 5. CTA banner
    m.add(4, {
      id = 4;
      var name = "CTA Banner";
      var description = "Full-width call-to-action with headline + pill button";
      var category = "cta";
      var html = "<section style=\"font-family:'Comic Sans MS','Segoe Print',cursive;margin:24px 0;padding:48px 24px;background:#1f2937;border:3px solid #1f2937;border-radius:24px;text-align:center;box-shadow:6px 6px 0 #6366f1\"><h2 style=\"color:#fff;font-size:32px;margin:0 0 8px\">Ready to sketch your idea?</h2><p style=\"color:#d1d5db;font-size:16px;margin:0 0 24px\">Join thousands of makers drawing their next product.</p><a href=\"#\" style=\"display:inline-block;background:#6366f1;color:#fff;padding:14px 36px;border-radius:999px;text-decoration:none;border:2px solid #fff;box-shadow:3px 3px 0 #fff\">Start Drawing — Free</a></section>";
    });

    // 6. Navbar
    m.add(5, {
      id = 5;
      var name = "Navbar";
      var description = "Logo + nav links + sign-in pill, sketchy underline";
      var category = "navbar";
      var html = "<nav style=\"font-family:'Comic Sans MS','Segoe Print',cursive;display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:#fff;border-bottom:3px solid #1f2937;box-shadow:0 4px 0 #6366f1\"><div style=\"display:flex;align-items:center;gap:8px\"><span style=\"font-size:24px\">✏️</span><span style=\"font-weight:bold;color:#1f2937;font-size:20px\">Sketchy</span></div><div style=\"display:flex;gap:24px\"><a href=\"#\" style=\"color:#1f2937;text-decoration:none;border-bottom:2px dashed #8b5cf6;padding-bottom:2px\">Features</a><a href=\"#\" style=\"color:#1f2937;text-decoration:none\">Templates</a><a href=\"#\" style=\"color:#1f2937;text-decoration:none\">Pricing</a></div><a href=\"#\" style=\"background:#6366f1;color:#fff;padding:8px 20px;border-radius:999px;text-decoration:none;border:2px solid #1f2937;box-shadow:2px 2px 0 #1f2937\">Sign in</a></nav>";
    });

    m;
  };

  public func migration(old : OldActor) : NewActor {
    {
      var state = {
        var project = old.state.project;
        var tabs = old.state.tabs;
        var strokes = old.state.strokes;
        var comments = old.state.comments;
        var regions = old.state.regions;
        // New: version history begins empty — existing regions have no prior
        // snapshots.
        var versions = Map.empty();
        // New: real-time collaboration presence begins empty.
        var presence = Map.empty();
        // New: curated template library, seeded with 6 sketchy-aesthetic
        // templates. nextTemplateId is set to the count of seeded templates
        // so the next user-inserted template gets a fresh id.
        var templates = seedTemplates();
        var nextProjectId = old.state.nextProjectId;
        var nextTabId = old.state.nextTabId;
        var nextStrokeId = old.state.nextStrokeId;
        var nextCommentId = old.state.nextCommentId;
        var nextRegionId = old.state.nextRegionId;
        var nextVersionId = 0;
        var nextPresenceId = 0;
        var nextTemplateId = 6;
      };
      var accessControlState = old.accessControlState;
    };
  };
};
