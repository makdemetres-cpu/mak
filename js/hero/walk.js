/* ==========================================================================
   Ermis' Villas — the walk through the house
   --------------------------------------------------------------------------
   Seven photographs of one house, walked rather than shown.

   ⚠️  NOT IMPORTED. The hero is the modelled villa again, wearing surfaces
   cut from these same photographs — see js/hero/skin.js. This file is kept
   because the hero has changed direction more than once and this is a
   complete, working alternative one import away. See README -> "The hero".

   The brief was specific: not a slideshow. So this is not seven pictures
   fading into one another — it is a camera moving forward, continuously,
   down a corridor of photographs standing at increasing depth, with the
   change from one to the next timed to land on a doorway that is really in
   the picture.

   Nothing here is animated on a clock: `t` is scroll progress, so the walk
   stops dead when the visitor stops and runs backwards exactly when they
   scroll back up.

   1. A photograph is not a flat card
   ----------------------------------
   This is the idea the first two versions of this hero were missing, and no
   amount of cleverness in the transitions covered for it. Moving a camera at
   a flat card does not look like walking, it looks like zooming, because
   every part of the picture grows at exactly the same rate. What the eye
   reads as movement through a space is parallax — near things sliding past
   faster than far things — and a flat card has none.

   So each photograph is projected onto a shallow open box: a floor running
   away to the horizon, a wall down either side, a ceiling where the picture
   has one. See depthAt(). The camera moves into that box and everything
   parallaxes correctly, because the geometry is correct.

   Cutting each photograph into three or four flat layers instead is what
   produces the cardboard-cutout look — the cuts are real discontinuities and
   the eye finds them at once. There is not one cut in this surface.

   2. Every surface covers the frame
   ---------------------------------
   Sized from the live fov and aspect so it covers exactly at the furthest
   distance it is ever seen from. Because the displacement only ever moves
   points toward the camera, sizing the flat plane is a safe bound for the
   whole surface. No photograph is cropped on disk for framing.

   3. The camera walks, and aims
   -----------------------------
   One line, no easing of its own. Each photograph names the point you are
   walking toward — the sliding doors in the living room, the opening behind
   the dining table, the bedroom's window — and over the chapter the surface
   slides so that point comes to the middle of the frame. You are not drifting
   through the middle of a picture; you are heading somewhere in it.

   4. The room opens; it does not dissolve
   ---------------------------------------
   Pressing a camera into a photograph does not get you out of it: the far
   wall is a picture of a far wall, and walking at it just makes it a bigger
   picture of a far wall. So at the handover an aperture grows outward from
   the point being walked toward (openTo) while the outgoing surface races the
   camera (EXIT) so its near floor and walls cross the near plane and are
   clipped away. What is ahead of you gives way; what is beside you passes
   you. Between the two there is nothing left to dissolve, and material
   opacity never moves off 1 for the entire walk.

   The name on the first frame
   ---------------------------
   The opening photograph is drawn three times: the photograph, then the
   villa's name, then the same photograph again with the sky cut out
   (assets/img/walk/01-cut.png, made by tools/villa-walk.py). The roofline
   and the stone wall therefore pass in front of the type, which is why it
   reads as standing behind the house rather than lying on top of it. It
   fades out over the first tenth of the scroll.

   ⚠️  RIGHTS: these photographs came from a listing or agency site and are
   NOT cleared for publication. See README -> "Photography".
   ========================================================================== */

/* The slim bundle exports Texture but not CanvasTexture or the filter
   constants — Texture takes a canvas perfectly well, and magFilter's default
   is the LinearFilter that minFilter wants once mipmaps are off. Same setup
   photos.js used. */
import { Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture }
  from '../vendor/three.slim.js?v=260830a';
import { chapterAt, clamp01 } from './path.js?v=260830a';

/* --------------------------------------------------------------------------
   The route
   --------------------------------------------------------------------------
   In walking order, one per chapter. Six numbers per photograph, and every one
   of them is a judgement about what is actually in the picture:

   aim      The point in the frame the camera walks toward, in units of half
            the plane — [0.5, 0] is halfway to the right edge. The doorway.

   horizon  Where the distance is, as a fraction up the frame: 0 is the bottom
            edge, 1 the top. On the terraces it is the sea; indoors it is the
            far wall. Everything below it is floor running away from you and
            is modelled as such.

   floor    How strongly the bottom of the frame is brought toward the camera,
            0–1. This is most of the parallax: the ground under your feet is
            the nearest thing in almost every photograph.

   wall     [left, right], 0–1 each, and deliberately not symmetric. In the
            first photograph the stone wall is hard against the lens on the
            right while the left of the frame is open sea a kilometre away, so
            [0.15, 1.0]. Making both sides equal is what turns a walk into a
            zoom.

   ceil     How far the top of the frame comes forward. Zero outdoors — the
            sky is the one thing that must never rush past you — and modest
            indoors, where there is a real ceiling above your head.

   pan      Optional, and only ever does anything on a narrow screen. These
            are landscape photographs, and a phone held upright sees roughly
            the middle third of one — so the question "what should a phone
            see?" has a different answer per picture, and six of these seven
            answer it by themselves. The bedroom does not: its middle third is
            a blank wall, with the bed and the window with the view either
            side of it. `pan` slides which third the phone gets, in half-plane
            units, and is clamped at runtime so it can never pull the frame
            off the edge of the picture. On a wide screen there is no spare
            picture to slide and the clamp takes it to nothing by itself.
   -------------------------------------------------------------------------- */
const SHOTS = [
  { file: '01', aim: [0.06, -0.06],
    horizon: 0.53, floor: 1.00, wall: [0.15, 1.00], ceil: 0,
    alt: 'Villa Kyma seen across the pool, the stone wall of the terrace in the foreground.' },
    // Walk in along the terrace toward the sliding doors under the balcony.
    // The stone wall on the right is the nearest thing in the whole sequence.

  { file: '02', aim: [-0.30, -0.10],
    horizon: 0.52, floor: 1.00, wall: [0.45, 0.45], ceil: 0,
    alt: 'The terrace and the pool, the house behind with its shaded balcony.' },
    // Toward the glazed doors at the left of the facade — where you go in.

  { file: '03', aim: [0.10, -0.02],
    horizon: 0.53, floor: 1.00, wall: [0.35, 0.85], ceil: 0,
    alt: 'Seating in the shade of a sail, against the stone wall by the pool.' },
    // The wooden door in the stone wall, dead ahead. Stone on the right again.

  { file: '04', aim: [0.30, 0.02],
    horizon: 0.55, floor: 0.95, wall: [0.80, 0.55], ceil: 0.55,
    alt: 'The living room, looking out through sliding doors to the pool and the sea.' },
    // The sliding doors on the right. This is the threshold of the whole
    // sequence: it is the shot that looks back out at the terrace we walked.

  /* Kitchen before dining, which is not the order the files are in. The
     fifth chapter of the copy is "a chef in your kitchen, not ours" and the
     sixth is a long table — so the room on screen is the room being talked
     about. They adjoin in this house, so the route is no less true for it. */
  { file: '06', aim: [-0.34, 0.00],
    horizon: 0.57, floor: 0.90, wall: [0.75, 0.70], ceil: 0.50,
    alt: 'The kitchen, an island with stools and a door open to the terrace.' },
    // The open door at the far left.

  { file: '05', aim: [-0.02, 0.06],
    horizon: 0.55, floor: 0.90, wall: [0.80, 0.80], ceil: 0.50,
    alt: 'The dining table under a woven pendant, the terrace beyond the opening.' },
    // Straight through the opening behind the table.

  { file: '07', aim: [0.26, 0.04], pan: 0.50,
    horizon: 0.55, floor: 1.00, wall: [0.70, 0.40], ceil: 0.45,
    alt: 'A bedroom with a corner window onto the hills.' }
    // The corner window. The walk ends looking out of it — and on a phone the
    // pan is what puts that window in the frame at all: centred, the last
    // thing anyone sees of this house is two metres of bare plaster.
];

/* Distance at which a photograph exactly covers the frame — its arrival. */
const ARRIVE = 12;

/* How far the camera walks per chapter. ARRIVE minus this is how close it
   gets before the handover, so it also sets the magnification:
   12 / (12 - 6.6) = 2.2x by the end of a chapter. Larger and the outgoing
   photograph becomes a crop of a crop; smaller and it stops feeling like
   walking and starts feeling like leaning. */
const SPACING = 6.6;

/* The handover, as a fraction of a chapter. Short on purpose: this is a cut
   made at speed, not a dissolve. */
const HANDOVER = 0.10;

/* How far the outgoing photograph is pulled toward the camera as it goes.
   Over the handover it races the camera; its near edges cross the near plane
   and are clipped away, so the next room is uncovered from the outside of the
   frame inward — the walls of the room you are leaving passing you, rather
   than a picture dissolving. */
const EXIT = 4.4;

/* A photograph is never asked to sit exactly on the frame edge — a rounding
   error at the edge of the frustum shows as a one-pixel seam. */
const BLEED = 1.03;

/* How much of a normal chapter's walk the LAST chapter covers. See the note
   in update(): with nothing to hand over to, the final room is where the
   camera comes to rest, and it has to come to rest somewhere you would want
   to stand rather than with its nose against the far wall. */
const LAST_WALK = 0.55;

/* --------------------------------------------------------------------------
   Depth
   --------------------------------------------------------------------------
   A photograph is flat and has no depth in it, and for two builds this hero
   pretended otherwise: seven flat cards, handed over at speed. Moving a
   camera at a flat card does not look like walking, it looks like zooming,
   because every part of the picture grows at exactly the same rate. What the
   eye actually reads as movement through a space is PARALLAX — near things
   sliding past faster than far things — and a flat card has none of it.

   So each photograph is not a card. It is projected onto a shallow, open
   box: a floor running away from you to the horizon, a wall down either side,
   a ceiling where the picture has one. The camera then moves into that box
   and everything parallaxes correctly, because the geometry is correct.

   The obvious alternative — cutting each photograph into three or four flat
   layers at different depths — is what produces the cardboard-cutout look,
   because the cuts are real discontinuities and the eye finds them
   immediately. There is not one cut in this surface. It is a single
   continuous sheet, so there is no edge to catch.

   These are the depths in world units, at the nominal frame size; the walk
   scales them with the frame so a phone gets the same move as a laptop and
   not a flattened version of it. The camera covers SPACING = 6.6 units per
   chapter and arrives at 12, so a floor depth of 3.2 means the ground at your
   feet ends the chapter about two and a half times nearer than the far wall.
   Push these much further and the picture smears, because a photographed
   floor stretched to near-vertical on screen is being asked for detail it
   never recorded. -------------------------------------------------------- */
const FLOOR_DEPTH = 3.2;
const WALL_DEPTH  = 3.0;
const CEIL_DEPTH  = 1.6;

/* The frame height the depths above are quoted at — the height of the frame
   at the arrival distance on a wide screen. Everything is scaled from this,
   so the parallax is proportional to what you can see rather than absolute. */
const NOMINAL_H = 9.2;

/* Grid resolution of the surface. It only has to be fine enough that the
   creases where floor meets wall are not visibly faceted; the texture itself
   is interpolated perspective-correct by the GPU whatever this is. 48 x 27 is
   1,296 quads, which on this scene is free. */
const SEG_X = 48;
const SEG_Y = 27;

/* The doorway. How far out from the point being walked toward counts as "the
   edge of the frame" for the purposes of opening — in frame widths, so 0.75
   means the corners are the last thing to give way. */
const DOOR_REACH = 0.75;

/* How soft the opening edge is, as a fraction of the radius of what is
   actually on screen — not of the photograph.

   That distinction is the whole thing, and getting it wrong cost a build. By
   the time a chapter hands over, the camera is close enough that the visible
   part of the photograph is only its middle sixth or so. An aperture measured
   against the photograph therefore has its entire soft edge spread across the
   whole screen, and a soft edge across the whole screen is a crossfade — the
   same crossfade, arrived at from a completely different direction. Measured
   against the screen instead, the edge stays an edge at any magnification.

   0.45 is where it stops being read as a shape and has not yet become a haze.
   Tighter is an iris wipe, which is a film-school transition and reads as
   one; wider is a dissolve. */
const DOOR_SOFT = 0.45;

/* How far past the edge of the screen the aperture travels before the chapter
   is over — the screen's corners are further from its middle than its edges
   are, and a rim of the old room left hanging in the corners is exactly as
   wrong as one left across the middle. */
const DOOR_OVERRUN = 1.9;

export function buildWalk(scene, camera, onReady) {
  const wide = !window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  const size = wide ? '' : '-sm';
  const webp = supportsWebP();
  const ext = webp ? 'webp' : 'jpg';

  const shots = SHOTS.map((s, i) => ({
    ...s,
    index: i,
    url: `assets/img/walk/${s.file}${size}.${ext}`,
    mesh: null,
    tex: null,
    asked: false,
    ready: false
  }));

  /* ---- The title, drawn to a canvas ---- */
  const title = makeTitle();
  let titleMesh = null;
  let cutMesh = null;

  /* ------------------------------------------------------------------
     The surface a photograph is projected onto
     ------------------------------------------------------------------
     A unit grid displaced along its own z. Positive z is toward the camera,
     which looks down -z, so a vertex with a large value here is a piece of
     the picture that is close to you.

     Three surfaces, and the vertex takes whichever of them is nearest —
     max(), not a sum, so that the corner where the floor meets the wall is a
     corner and not a spike twice the height of either.
     ------------------------------------------------------------------ */
  function depthAt(shot, x, y) {
    // Local plane coordinates run -0.5 .. 0.5. Work in 0 .. 1 instead: it is
    // the frame as you would describe it out loud, u across and v up.
    const u = x + 0.5;
    const v = y + 0.5;

    const hz = shot.horizon;

    // The floor. Full depth at the bottom edge of the frame, nothing at the
    // horizon and nothing above it. The exponent is the perspective: ground
    // recedes fast at your feet and slowly in the distance, so a straight
    // ramp reads as a tilted board rather than as a floor.
    const g = hz > 0 ? clamp01((hz - v) / hz) : 0;
    let z = FLOOR_DEPTH * shot.floor * Math.pow(g, 1.7);

    // The ceiling, above the horizon. Zero outdoors — see the note on `ceil`
    // in the route table; bringing the sky toward the camera is the single
    // most obviously wrong thing this surface could do.
    if (shot.ceil > 0 && hz < 1) {
      const c = clamp01((v - hz) / (1 - hz));
      z = Math.max(z, CEIL_DEPTH * shot.ceil * Math.pow(c, 1.7));
    }

    // The side walls, measured out from the point being walked toward rather
    // than from the middle of the frame. Walk toward the right of a picture
    // and it is the left wall that sweeps past you — which is the asymmetry
    // that makes a move read as going somewhere rather than closing in.
    const fu = clamp01(0.5 + shot.aim[0] * 0.5);
    let w = 0;
    if (u < fu && fu > 0)      w = shot.wall[0] * clamp01((fu - u) / fu);
    else if (u > fu && fu < 1) w = shot.wall[1] * clamp01((u - fu) / (1 - fu));
    if (w > 0) z = Math.max(z, WALL_DEPTH * w * w);

    return z;
  }

  /* How far each vertex is from the point being walked toward, 0 at that
     point and 1 out at the edges of the frame. It is the order in which the
     picture gives way at the handover: what is straight ahead of you goes
     first, what is beside you goes last. See openTo(). */
  function reachOf(shot, x, y) {
    const fu = 0.5 + shot.aim[0] * 0.5;
    const fv = 0.5 + shot.aim[1] * 0.5;
    const du = (x + 0.5) - fu;
    const dv = (y + 0.5) - fv;
    return clamp01(Math.hypot(du, dv) / DOOR_REACH);
  }

  function surfaceFor(shot, tex, order, flat) {
    const mat = new MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexColors: !flat
    });

    // The title is the one thing here that stays a flat card: it is lettering
    // set into the sky, not a surface in the room, and bending it would read
    // as a mistake.
    const geo = flat
      ? new PlaneGeometry(1, 1)
      : new PlaneGeometry(1, 1, SEG_X, SEG_Y);

    let open = null;

    if (!flat) {
      const pos = geo.attributes.position;
      const n = pos.count;

      /* A four-component colour attribute, which is what turns on per-vertex
         alpha (USE_COLOR_ALPHA) — the mechanism the handover needs. White
         throughout, so it tints nothing; only the fourth channel is ever
         touched, and only while a chapter is handing over.

         The bundle does not export Float32BufferAttribute, so the attribute
         is built through the constructor of one that already exists. That is
         the same class, reached the only way a slim build allows without
         adding an export and rebuilding it. */
      const Attr = pos.constructor;
      const rgba = new Float32Array(n * 4);
      open = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        pos.setZ(i, depthAt(shot, x, y));
        open[i] = reachOf(shot, x, y);
        rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 1;
        rgba[i * 4 + 3] = 1;
      }
      pos.needsUpdate = true;
      geo.setAttribute('color', new Attr(rgba, 4));
    }

    const mesh = new Mesh(geo, mat);
    mesh.frustumCulled = false;   // it is deliberately half off-screen
    mesh.renderOrder = order;
    mesh.visible = false;
    mesh.userData.open = open;      // null on the flat title card
    mesh.userData.aperture = null;  // null means sealed — see openTo()
    scene.add(mesh);
    return mesh;
  }

  /* ------------------------------------------------------------------
     The doorway
     ------------------------------------------------------------------
     The handover, done as a hole rather than as a fade.

     Pushing the camera into a photograph does not get you out of it: the far
     wall is a picture of a far wall, and walking at it just makes it a bigger
     picture of a far wall. The room has to open.

     So over the handover an aperture grows outward from the point being
     walked toward. What is straight ahead gives way first and the next room
     shows through it; what is beside you stays solid, and leaves by passing
     the camera instead. Between the two there is nothing left to dissolve.

     `rVis` is the radius of what is currently on screen, in the same units
     `open` is baked in, and everything is measured against it — see the note
     on DOOR_SOFT. The aperture starts a full feather *behind* the vertex
     nearest the door rather than on it, because the alpha of a vertex is its
     distance beyond the aperture in feathers: begin at zero and the middle of
     every photograph is half transparent from the first frame of its chapter,
     which is two rooms superimposed all the way down. It ends past the
     corners for the mirror-image reason. ---------------------------------- */
  function openTo(mesh, e, rVis) {
    const open = mesh.userData.open;
    if (!open) return;

    const col = mesh.geometry.attributes.color;
    const arr = col.array;

    // Sealed: every vertex opaque. Written once on the way out of a handover
    // and then never again, so scrolling through a chapter costs nothing here.
    if (e <= 0) {
      if (mesh.userData.aperture === null) return;
      mesh.userData.aperture = null;
      for (let i = 0; i < open.length; i++) arr[i * 4 + 3] = 1;
      col.needsUpdate = true;
      return;
    }

    const feather = Math.max(0.02, DOOR_SOFT * rVis);
    const radius = -feather + e * (rVis * DOOR_OVERRUN + feather);
    mesh.userData.aperture = radius;

    for (let i = 0; i < open.length; i++) {
      arr[i * 4 + 3] = clamp01((open[i] - radius) / feather);
    }
    col.needsUpdate = true;
  }

  function load(shot) {
    if (shot.asked) return;
    shot.asked = true;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = tex.magFilter;
      tex.needsUpdate = true;
      shot.tex = tex;
      shot.aspect = img.naturalWidth / img.naturalHeight;
      /* Depth testing is off — these surfaces are drawn strictly in the order
         given — so the order has to run from the back of the corridor
         forward, or the photograph you are walking *towards* paints over the
         one you are still inside. Hence (n - index): nearest last, on top.
         Spaced by 10 so the opening frame's three layers (photograph, name,
         cut-out) fit above it without reaching the next photograph.

         Depth testing stays off rather than being switched on now that these
         have real depth: within one surface nothing overlaps itself in screen
         space (it is a height field seen from the front), and between
         surfaces the order is exactly the walking order, which is what a
         depth buffer would have to work out again per pixel. */
      shot.mesh = surfaceFor(shot, tex, (shots.length - shot.index) * 10);
      shot.ready = true;

      if (shot.index === 0) buildOpening(shot);
      if (onReady) onReady();
    };
    img.onerror = () => { shot.asked = false; };   // let a later chapter retry
    img.src = shot.url;
  }

  /* ---- The three layers of the opening frame ---- */
  function buildOpening(shot) {
    if (titleMesh || !title) return;

    const tex = new Texture(title.canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = tex.magFilter;
    tex.needsUpdate = true;
    title.onRepaint(() => { tex.needsUpdate = true; if (onReady) onReady(); });
    const base = (shots.length - shot.index) * 10;
    // Flat: lettering set into the sky, not a surface in the room.
    titleMesh = surfaceFor(shot, tex, base + 1, true);

    const cut = new Image();
    cut.decoding = 'async';
    cut.onload = () => {
      const ctex = new Texture(cut);
      ctex.colorSpace = SRGBColorSpace;
      ctex.generateMipmaps = false;
      ctex.minFilter = ctex.magFilter;
      ctex.needsUpdate = true;
      /* The cut-out is the same photograph with the sky removed, drawn over
         the name so the roofline occludes it — so it has to be bent onto
         exactly the same surface as the photograph beneath, or the building
         in it would sit a few pixels off the building in the picture and the
         whole trick would fall apart. Same shot, same displacement. */
      cutMesh = surfaceFor(shot, ctex, base + 2);
      if (onReady) onReady();
    };
    // Always the PNG: the cut-out needs an alpha channel, and it is the one
    // file here that cannot be a JPEG.
    cut.src = `assets/img/walk/01-cut${size}.png`;
  }

  /* ------------------------------------------------------------------
     Layout — recomputed only when the frame shape changes
     ------------------------------------------------------------------ */
  let frameH = 0, frameW = 0, depthScale = 1, halfTan = 0, lastKey = '';

  function measure() {
    const key = camera.aspect.toFixed(4) + ':' + camera.fov.toFixed(2);
    if (key === lastKey) return;
    lastKey = key;

    /* Sized to cover at the FURTHEST distance a photograph is ever seen from,
       not at its arrival. The furthest is the moment it is uncovered — the
       start of the outgoing photograph's handover, one handover-width behind
       its own arrival. Size for the arrival instead and there is a sliver of
       empty frame around the incoming photograph for exactly as long as the
       cut lasts, which is precisely when it is most visible.

       Note this is measured on the FLAT plane, and the surface is displaced
       only toward the camera — never away — so every displaced point covers
       at least as much as the flat one would. Sizing flat is therefore the
       safe bound for the whole surface, and there is no case to check. */
    const fov = camera.fov * Math.PI / 180;
    halfTan = Math.tan(fov / 2);
    const far = ARRIVE + HANDOVER * SPACING;
    frameH = 2 * far * halfTan;
    frameW = frameH * camera.aspect;

    /* The depths in the route table are quoted against a nominal frame. A
       portrait phone sees a much taller frame at the same distance, so left
       absolute those depths would be a proportionally smaller move and the
       parallax would quietly drain away on exactly the devices that need it
       most. Scaling by the frame keeps the walk the same walk everywhere.

       It is applied as scale.z on the mesh rather than rebuilt into the
       geometry, so a rotated phone costs one multiply and not seven grids of
       1,296 quads each. */
    depthScale = frameH / NOMINAL_H;
  }

  /* Cover fit: the surface is at least as big as the frame in both axes. */
  function sizeOf(aspect) {
    let h = frameH, w = h * aspect;
    if (w < frameW) { w = frameW; h = w / aspect; }
    return [w * BLEED, h * BLEED];
  }

  /* ------------------------------------------------------------------
     The frame
     ------------------------------------------------------------------ */
  function update(t) {
    measure();

    /* Which chapter, and how far through it — asked of path.js rather than
       worked out here. This file used to divide the scroll into equal sevenths
       of its own, which agreed with the chapter bands only by accident, and
       for most of last night did not: the panel beside the photograph was up
       to a chapter and a half out. One source of truth, so the room on screen
       and the words beside it cannot drift apart again. */
    const n = shots.length;
    const at = chapterAt(clamp01(t));
    const k = Math.min(n - 1, at.index);   // one photograph per chapter, but
    const local = clamp01(at.local);       // never index off the end of either

    // Load this one and the next, and nothing else: somebody who never
    // scrolls never fetches six photographs.
    load(shots[k]);
    if (shots[k + 1]) load(shots[k + 1]);

    /* How far through this chapter the walk has actually got. It is `local`
       everywhere except the last chapter, which is a special case for a
       simple reason: every other chapter ends by handing over, and the
       handover is what saves you from the fact that pressing a camera into a
       photograph eventually just presses it into a wall. The last chapter has
       nothing to hand over to. Walked at full stride it ended with the bedroom
       enlarged past two hundred percent and softening into a blur — flying
       into a wall, and the last thing anyone sees of the house.

       So the last chapter walks a shorter distance and eases to rest over it.
       That is the one place in this file easing is right: everywhere else the
       damping in index.js is what makes the move feel like a person rather
       than a slider, and easing twice only makes it soggy — but an ending
       that decelerates is an arrival, and an ending at constant speed that
       simply stops is a stall. */
    const last = k === n - 1;
    const advance = last
      ? (1 - (1 - local) * (1 - local)) * LAST_WALK
      : local;

    camera.position.set(0, 0, ARRIVE - (k + advance) * SPACING);
    camera.lookAt(0, 0, camera.position.z - 1);

    for (let i = 0; i < n; i++) {
      const s = shots[i];
      if (!s.ready) continue;

      // Only the chapter in hand and the one behind it can be on screen.
      const rel = i - k;
      if (rel < 0 || rel > 1) { hide(s); continue; }

      const [w, h] = sizeOf(s.aspect);
      // z carries the depth scale — see measure(). The displacement in the
      // geometry is in nominal units and this is what makes it a real number
      // of metres in front of whatever frame the visitor actually has.
      s.mesh.scale.set(w, h, depthScale);

      /* Walk toward the aim point: over the chapter the surface slides so that
         point arrives at the centre of the frame. Driven by `advance` and not
         by `local`, so the last chapter's shorter, decelerating walk slides
         its picture by the matching amount instead of sliding a full
         chapter's worth across half a chapter's travel.

         Both axes are clamped to the picture the frame is not currently
         showing, which is the only thing standing between a slide and a strip
         of empty frustum down one edge. That spare picture is not a constant:
         it is nearly nothing at a chapter's arrival on a wide screen, and it
         grows as the camera closes in — which is exactly the shape the aim
         drift has, and why this has held up without the clamp. It does not
         hold up once `pan` slides the picture from the first frame of a
         chapter as well, and on a phone that is the whole point of pan. */
      const zHere = -i * SPACING;
      const dHere = Math.max(0.05, camera.position.z - zHere);
      const visH = 2 * dHere * halfTan;
      const roomX = Math.max(0, 1 - (visH * camera.aspect) / w) * 0.94;
      const roomY = Math.max(0, 1 - visH / h) * 0.94;

      const drift = rel === 0 ? advance : 0;
      const wantX = (s.pan || 0) + s.aim[0] * drift;
      const wantY = s.aim[1] * drift;
      const ax = -clampTo(wantX, roomX) * (w / 2);
      const ay = -clampTo(wantY, roomY) * (h / 2);
      s.mesh.position.set(ax, ay, zHere);

      /* The handover, in two halves that do the same job to different parts
         of the picture: the room ahead of you opens (openTo), and the walls
         beside you leave by passing the camera (exit). Neither is a fade.

         `material.opacity` stays at 1 throughout. It used to run 1 → 0 here,
         and that was the crossfade this hero kept accidentally reinventing —
         a whole translucent room laid over another whole room. The only alpha
         that moves now is per-vertex, and it moves outward from the door. */
      let e = 0;
      if (rel === 0 && !last) {
        const into = (local - (1 - HANDOVER)) / HANDOVER;
        if (into > 0) e = smooth(into);
      }
      /* `!last` is load-bearing. The final chapter runs to local 0.93, which
         reaches into the handover band like any other — except there is no
         eighth photograph behind it. Left to hand over, the walk ends by
         opening a hole in the middle of the bedroom onto nothing at all. */
      s.mesh.position.z += e * EXIT;

      /* The radius of what is on screen, expressed in the units `open` was
         baked in — half the visible height as a fraction of the surface's
         own half-height, then divided by the reach the bake normalised to.
         It shrinks as the camera closes in, which is exactly why the aperture
         cannot be a fixed number. */
      const d = Math.max(0.05, camera.position.z - s.mesh.position.z);
      openTo(s.mesh, e, (d * halfTan) / h / DOOR_REACH);

      s.mesh.material.opacity = 1;
      s.mesh.visible = e < 0.999;

      if (i === 0) placeOpening(s, ax, ay, w, h, e < 0.999 ? 1 : 0, t);
    }
  }

  function placeOpening(s, ax, ay, w, h, alpha, t) {
    /* The name goes with the photograph it is standing behind — same slide,
       same scale — but only half as far vertically. Following the walk exactly
       would carry it up under the site's own wordmark before it has finished
       fading, and a second "ERMIS' VILLAS" with "Villa Kyma" printed through
       it is the one collision the sky has no room for. Half the drift keeps it
       parallaxed against the building without ever reaching the header. */
    const fade = 1 - clamp01(t / 0.05);
    const on = fade > 0.001 && alpha > 0.001;

    if (titleMesh) {
      titleMesh.visible = on;
      if (on) {
        /* High in the open sky and just left of centre. Two constraints fight
           here: the hero's own headline owns the left third of the frame from
           about a quarter down, and the roofline climbs from the middle to the
           right. This sits above the first and lets the second cut across the
           tail of the name, which is the whole point of the cut-out. */
        const tw = w * 0.38;
        titleMesh.scale.set(tw, tw / title.aspect, 1);
        titleMesh.position.set(ax - w * 0.15, ay * 0.5 + h * 0.27, -0.04);
        titleMesh.material.opacity = fade * alpha;
      }
    }
    if (cutMesh) {
      cutMesh.visible = on;
      if (on) {
        // Same size, same slide and the same depth scale as the photograph it
        // is standing on — it has to register with it exactly, because its
        // whole job is to put that building's roofline in front of the name.
        cutMesh.scale.set(w, h, depthScale);
        cutMesh.position.set(ax, ay, -0.02);
        cutMesh.material.opacity = alpha;
      }
    }
  }

  function hide(s) {
    if (s.mesh) s.mesh.visible = false;
    if (s.index === 0) {
      if (titleMesh) titleMesh.visible = false;
      if (cutMesh) cutMesh.visible = false;
    }
  }

  load(shots[0]);
  load(shots[1]);

  return { update, shots };
}

/* -------------------------------------------------------------------------- */

function smooth(x) {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
}

/* Symmetric clamp to ±limit. */
function clampTo(v, limit) {
  return v < -limit ? -limit : v > limit ? limit : v;
}

/* The villa's name, drawn once to a canvas. Fraunces at a display optical
   size, letter-spaced, in the bone the rest of the site uses. Drawn at 2x so
   it holds up when the plane is 60% of a wide frame. */
function makeTitle() {
  if (typeof document === 'undefined') return null;
  const name = (window.EV && window.EV.HERO_TITLE) || '';
  if (!name) return null;

  const W = 1400, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const paint = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F3F0E8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '300 190px Fraunces, Georgia, serif';
    // A little tracking, set by hand rather than by letterSpacing, which
    // Safari only learned recently.
    const track = 6;
    const chars = name.split('');
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
    let x = W / 2 - total / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], x + widths[i] / 2, H / 2);
      x += widths[i] + track;
    }
  };

  paint();

  /* Fraunces is self-hosted and can land after this runs, so the name would
     otherwise be stuck in the fallback serif for the life of the page. When
     it arrives, repaint and tell whoever is holding the texture. */
  let repaint = null;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      paint();
      if (repaint) repaint();
    });
  }
  return { canvas, aspect: W / H, onRepaint(fn) { repaint = fn; } };
}

function supportsWebP() {
  try {
    const c = document.createElement('canvas');
    return c.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
}
