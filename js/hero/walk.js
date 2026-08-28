/* ==========================================================================
   Ermis' Villas — the walk through the house
   --------------------------------------------------------------------------
   Seven photographs of one house, walked rather than shown.

   The brief was specific: not a slideshow. So this is not seven pictures
   fading into one another — it is a camera moving forward, continuously,
   down a corridor of photographs standing at increasing depth, with the
   change from one to the next timed to land on a doorway that is really in
   the picture.

   How the walk is built
   ---------------------
   Each photograph is a plane facing the camera, standing at z = -k * SPACING.
   The camera starts ARRIVE units in front of the first one and moves steadily
   away from the viewer as the page scrolls. Nothing about that is animated on
   a clock: `t` is the same scroll progress that drove the old modelled hero,
   so the walk stops dead when the visitor stops and runs backwards exactly
   when they scroll back up.

   Every plane is sized so that it covers the frame exactly at distance
   ARRIVE. That is its "arrival": the moment its chapter begins and the whole
   photograph is on screen. From there the camera keeps coming, and because
   the plane is fixed in the world it grows — real perspective, not a scale
   animation. By the end of its chapter it is about 2.2x the size it arrived
   at, which is the point at which it hands over.

   Why the handover reads as a threshold and not as a dissolve
   ----------------------------------------------------------
   Two things happen at once, and both matter.

   First, `aim`. Each photograph names the point you are walking toward — the
   sliding doors in the living room, the opening to the terrace behind the
   dining table, the bedroom's window. Over the chapter the plane slides so
   that this point travels to the centre of the frame. You are not drifting
   through the middle of a picture; you are heading somewhere in it.

   Second, the timing. The outgoing photograph is released over a very short
   band at the very end of its chapter, when it is at its largest and its
   edges are leaving the frame fastest, and the incoming one is already at
   full opacity and full cover behind it. A crossfade held at a standstill
   reads as a crossfade; the same blend at speed, centred on a doorway, reads
   as passing through the doorway. It is the cut used in film for exactly
   this, and it costs nothing.

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
import { Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture, Vector3 }
  from '../vendor/three.slim.js?v=260828e';
import { CHAPTERS, chapterAt, clamp01 } from './path.js?v=260828e';

/* --------------------------------------------------------------------------
   The route
   --------------------------------------------------------------------------
   In walking order. `aim` is the point in the frame the camera walks toward
   over the chapter, in units of half the plane — so [0.5, 0] is halfway to
   the right edge, [0, -0.3] is a little below centre. It is the one judgement
   call per photograph, so each says what it is aiming at.
   -------------------------------------------------------------------------- */
const SHOTS = [
  { file: '01', aim: [0.06, -0.06],
    alt: 'Villa Kyma seen across the pool, the stone wall of the terrace in the foreground.' },
    // Walk in along the terrace toward the sliding doors under the balcony.

  { file: '02', aim: [-0.30, -0.10],
    alt: 'The terrace and the pool, the house behind with its shaded balcony.' },
    // Toward the glazed doors at the left of the facade — where you go in.

  { file: '03', aim: [0.10, -0.02],
    alt: 'Seating in the shade of a sail, against the stone wall by the pool.' },
    // The wooden door in the stone wall, dead ahead.

  { file: '04', aim: [0.30, 0.02],
    alt: 'The living room, looking out through sliding doors to the pool and the sea.' },
    // The sliding doors on the right. This is the threshold of the whole
    // sequence: it is the shot that looks back out at the terrace we walked.

  /* Kitchen before dining, which is not the order the files are in. The
     fifth chapter of the copy is "a chef in your kitchen, not ours" and the
     sixth is a long table — so the room on screen is the room being talked
     about. They adjoin in this house, so the route is no less true for it. */
  { file: '06', aim: [-0.34, 0.00],
    alt: 'The kitchen, an island with stools and a door open to the terrace.' },
    // The open door at the far left.

  { file: '05', aim: [-0.02, 0.06],
    alt: 'The dining table under a woven pendant, the terrace beyond the opening.' },
    // Straight through the opening behind the table.

  { file: '07', aim: [0.26, 0.04],
    alt: 'A bedroom with a corner window onto the hills.' }
    // The corner window. The walk ends looking out of it.
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
   This is the whole difference between a walk and a slideshow, and it took a
   double exposure on screen to see why: fading one photograph over another
   is a crossfade whichever one you fade, and at fifty percent it is simply
   two rooms on top of each other, which is what a dissolve looks like.

   So the outgoing frame does not fade in place — it leaves. Over the
   handover it races at the camera, roughly two and a half times its size
   again, and its edges fly out past the frame while it goes. What is left on
   screen is the next room, already whole, seen through the last of the one
   you are walking out of. That is what passing through a doorway looks like,
   and the blend reads as the blur of moving rather than as a fade. */
const EXIT = 3.6;

/* A photograph is never asked to sit exactly on the frame edge — a rounding
   error at the edge of the frustum shows as a one-pixel seam. */
const BLEED = 1.03;

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

  const group = [];

  /* ------------------------------------------------------------------
     Building a plane
     ------------------------------------------------------------------ */
  function planeFor(shot, tex, order) {
    const mat = new MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    });
    const mesh = new Mesh(new PlaneGeometry(1, 1), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
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
      /* Depth testing is off — these planes are drawn strictly in the order
         given — so the order has to run from the back of the corridor
         forward, or the photograph you are walking *towards* paints over the
         one you are still inside. Hence (n - index): nearest last, on top.
         Spaced by 10 so the opening frame's three layers (photograph, name,
         cut-out) fit above it without reaching the next photograph. */
      shot.mesh = planeFor(shot, tex, (shots.length - shot.index) * 10);
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
    titleMesh = planeFor(shot, tex, base + 1);   // just above the photograph

    const cut = new Image();
    cut.decoding = 'async';
    cut.onload = () => {
      const ctex = new Texture(cut);
      ctex.colorSpace = SRGBColorSpace;
      ctex.generateMipmaps = false;
      ctex.minFilter = ctex.magFilter;
      ctex.needsUpdate = true;
      cutMesh = planeFor(shot, ctex, base + 2);  // and the cut-out above that
      if (onReady) onReady();
    };
    // Always the PNG: the cut-out needs an alpha channel, and it is the one
    // file here that cannot be a JPEG.
    cut.src = `assets/img/walk/01-cut${size}.png`;
  }

  /* ------------------------------------------------------------------
     Layout — recomputed only when the frame shape changes
     ------------------------------------------------------------------ */
  let frameH = 0, frameW = 0, lastKey = '';

  function measure() {
    const key = camera.aspect.toFixed(4) + ':' + camera.fov.toFixed(2);
    if (key === lastKey) return;
    lastKey = key;

    /* Sized to cover at the FURTHEST distance a photograph is ever seen from,
       not at its arrival. The furthest is the moment it is uncovered — the
       start of the outgoing photograph's handover, one handover-width behind
       its own arrival. Size for the arrival instead and there is a sliver of
       empty frame around the incoming photograph for exactly as long as the
       cut lasts, which is precisely when it is most visible. */
    const fov = camera.fov * Math.PI / 180;
    const far = ARRIVE + HANDOVER * SPACING;
    frameH = 2 * far * Math.tan(fov / 2);
    frameW = frameH * camera.aspect;
  }

  /* Cover fit: the plane is at least as big as the frame in both axes. */
  function sizeOf(aspect) {
    let h = frameH, w = h * aspect;
    if (w < frameW) { w = frameW; h = w / aspect; }
    return [w * BLEED, h * BLEED];
  }

  /* ------------------------------------------------------------------
     The frame
     ------------------------------------------------------------------ */
  const pos = new Vector3();

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

    // The camera walks. One continuous line, no easing of its own — the
    // damping in index.js is what makes it feel like a person rather than a
    // slider, and doing it twice would only make it soggy.
    camera.position.set(0, 0, ARRIVE - (k + local) * SPACING);
    camera.lookAt(0, 0, camera.position.z - 1);

    let covered = false;

    for (let i = 0; i < n; i++) {
      const s = shots[i];
      if (!s.ready) continue;

      // Only the chapter in hand and the one behind it can be on screen.
      const rel = i - k;
      if (rel < 0 || rel > 1) { hide(s); continue; }

      const [w, h] = sizeOf(s.aspect);
      s.mesh.scale.set(w, h, 1);

      // Walk toward the aim point: over the chapter the plane slides so that
      // point arrives at the centre of the frame.
      const drift = rel === 0 ? local : 0;
      const ax = -s.aim[0] * (w / 2) * drift;
      const ay = -s.aim[1] * (h / 2) * drift;
      s.mesh.position.set(ax, ay, -i * SPACING);

      /* The handover: over the last sliver of its chapter the outgoing
         photograph rushes the camera and thins out as it goes, so it leaves
         the frame rather than dissolving in it. */
      let alpha = 1;
      let exit = 0;
      if (rel === 0) {
        const into = (local - (1 - HANDOVER)) / HANDOVER;
        if (into > 0) {
          const e = smooth(into);
          alpha = 1 - e;
          exit = e * EXIT;
        }
      }
      s.mesh.position.z += exit;
      s.mesh.material.opacity = alpha;
      s.mesh.visible = alpha > 0.001;
      if (rel === 0 && alpha > 0.999) covered = true;

      if (i === 0) placeOpening(s, ax, ay, w, h, alpha, t);
    }

    return covered;
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
        cutMesh.scale.set(w, h, 1);
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
