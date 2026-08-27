/* ==========================================================================
   Ermis' Villas — the photographs in the hero
   --------------------------------------------------------------------------
   ⚠️  NOT CURRENTLY LOADED. The owner asked for the code-drawn geometry back,
   so js/hero/index.js no longer imports this module and no page requests a
   single byte of it. It is kept, working and intact, because the photographs
   are meant to be replaced with real ones later.

   To switch it back on, three lines in js/hero/index.js:

     import { buildPhotos } from './photos.js?v=YYMMDD';        // with the others
     const photos = buildPhotos(scene, camera, () => wake());   // after buildVilla
     villa.visible = !photos.update(smooth, view.fovScale);     // in draw()

   The third needs `const { root: villa, doorPivot } = buildVilla(…)` rather
   than `const { doorPivot } = …`. The flat fallback's photographs are a
   separate switch, in css/site.css — see README → "The photographs".
   --------------------------------------------------------------------------
   Seven photographs, one per chapter of the camera move, standing in for the
   code-drawn surfaces of the villa.

   The camera choreography in path.js is untouched. Nothing here has a
   timeline, an autoplay or a clock of its own: every number below is derived
   from the same scroll progress `t` that drives the camera, so the whole hero
   still stops dead where the visitor stops and runs exactly backwards on the
   way up.

   How a photograph is put on the screen
   -------------------------------------
   Each one is a plane parented to nothing, placed each frame on the camera's
   own view axis and turned to face it square on. Its size is solved, again
   each frame, from the camera's current field of view, aspect and distance,
   so that it always covers the frame completely — the same idea as CSS
   `object-fit: cover`, done in three dimensions. Two consequences worth
   knowing:

     • No photograph is ever trimmed on disk for framing. What a given screen
       shape cannot fit simply falls outside the frustum, so a phone held
       upright sees almost the whole picture and a wide laptop sees a band
       through the middle of it. `focus` below chooses which band.

     • Because the solve uses the live camera values it survives the portrait
       field-of-view scaling and the portrait tilt in index.js without either
       of them having to know this file exists.

   How one becomes the next
   ------------------------
   Each photograph dissolves in on top of the one before it, which holds at
   full opacity underneath until the new one has completely covered it. The
   obvious alternative — fading one out while fading the other in — is worse
   than it sounds: two half-transparent images stacked over the model let a
   quarter of the model through between them, and the join reads as a
   double exposure rather than a cut. Holding the outgoing frame solid means
   the screen is only ever showing photography.

   It also has to survive being scrolled backwards, so the rule is written in
   terms of the pair rather than the direction: of any two neighbours, the
   later one carries the dissolve and the earlier one holds. Run the scroll up
   and the later one simply dissolves away again.

   Cost
   ----
   One draw call per visible photograph — one for most of the scroll, two
   across a join. While a photograph is covering the frame completely the
   villa behind it is switched off, which takes the frame from about
   forty-three draw calls to two. It comes straight back the moment there is
   anything to see through, so a photograph that fails to load or has not
   arrived yet leaves the modelled villa standing in its place.

   Textures load lazily, one chapter ahead of where the visitor is, and phones
   are served the smaller set: a 736px texture costs about 4MB of video memory
   against 16MB for the desktop one, and seven of the large ones on a phone is
   how you get a reloaded tab.
   ========================================================================== */

import { Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Texture, Vector3 }
  from '../vendor/three.slim.js?v=260827f';
import { CHAPTERS, clamp01 } from './path.js?v=260827f';

/* --------------------------------------------------------------------------
   The photographs, in the order the camera meets them.
   --------------------------------------------------------------------------
   `focus` picks the horizontal band to keep when a wide screen cannot show a
   tall photograph whole. It slides the picture *up* the frame, so a positive
   number shows more of the bottom of the picture and a negative one shows
   more of the top; 0 is dead centre. It is the one judgement call in this
   file, so each value says what it is protecting.

   `focusX` does the same sideways, which only bites on a portrait phone
   showing the single landscape frame.
   -------------------------------------------------------------------------- */
const PHOTOS = [
  { file: '01', focus:  0.12, focusX: 0,
    alt: 'The villa seen across the still pool at the end of the afternoon.' },
    // Down onto the terrace and the stone, keeping enough roofline to read as
    // a house. The bottom of the frame is pool and the top is empty sky.

  { file: '02', focus:  0.14, focusX: 0,
    alt: 'The approach at dusk, the path lit along its length to the front door.' },
    // The door and the lit steps, not the upper storey.

  { file: '03', focus:  0.08, focusX: 0,
    alt: 'The front door, lit from above and on both sides.' },
    // Nearly centred already. A touch down keeps the whole leaf in frame.

  { file: '04', focus:  0.22, focusX: 0,
    alt: 'The great room, double height, arched glazing along one wall.' },
    // The arched window and the table. The coffered ceiling is the first
    // thing that can go.

  // Fifth and sixth are deliberately not in file order. The fifth chapter is
  // "a chef in your kitchen, not ours" and the camera is turning onto the
  // island and its pendants; the sixth is the fireplace and the chandelier in
  // the double-height room. So the kitchen goes to the chef and the fire goes
  // to the evenings, which is both what the copy says and where the camera is
  // pointing.
  { file: '06', focus: -0.04, focusX: 0,
    alt: 'The kitchen, an olive tree at the window and the sun going down behind it.' },
    // A hair up, for the pendants and the hills. The island holds the bottom
    // of the frame on its own.

  { file: '05', focus:  0.00, focusX: 0,
    alt: 'The living room in the evening, fire lit, the pool beyond the glass.' },
    // The one landscape frame. Centred: fire, seating and water all sit on it.

  { file: '07', focus: -0.05, focusX: 0,
    alt: 'A bedroom above the water, the sun setting through the glass.' }
    // Up, for the horizon. Push it the other way and you have a very
    // expensive photograph of a bed.
];

/* Half the length of a dissolve, in scroll progress across the whole hero.
   0.03 of a 4,800px stage is about 145px of scrolling: long enough to read as
   a dissolve rather than a cut, short enough that the visitor is not looking
   at a blend for any length of time. */
const BAND = 0.030;

/* The photograph is oversized slightly on arrival and settles to an exact
   cover by the end of its chapter, which reads as a slow push in. Driven by
   scroll like everything else, so it stops when the visitor stops.

   ZOOM_MIN is never 1.0: at exactly 1.0 there is no slack at all, and a
   rounding error at the edge of the frustum shows as a one-pixel seam. */
const ZOOM_MIN = 1.04;
const ZOOM_MAX = 1.15;

/* Start fetching a photograph this far (in scroll progress) before its
   chapter begins. Enough time to arrive on a slow connection, late enough
   that a visitor who never scrolls never pays for six of them. */
const LOOKAHEAD = 0.17;

const DEG = Math.PI / 180;

function smoothstep(x) {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
}

/* Does this browser take WebP? All current ones do; the JPEGs are here for
   the ones that do not, at roughly double the bytes. */
function webpOK() {
  try {
    return document.createElement('canvas')
      .toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Build
   --------------------------------------------------------------------------
   `onReady` is called whenever a photograph finishes loading, so the host can
   wake the render loop — which by then has almost certainly shut itself down,
   the scene being static.
   -------------------------------------------------------------------------- */
export function buildPhotos(scene, camera, onReady) {
  const ext = webpOK() ? '.webp' : '.jpg';
  const base = 'assets/img/hero/';

  /* Which set to fetch is a question about video memory and screen size, and
     deliberately not the same question as the 3D quality tier next door —
     that one turns on core count, and a four-core desktop with a 1600px
     window still wants the sharp photographs.

     So: pointing device. A mouse means a laptop or a desktop, which has the
     memory for seven 1288px textures at roughly 10MB each. A finger means a
     phone or a tablet, where that would be 70MB of video memory and a tab
     that reloads itself halfway down the page — and where the frame is
     portrait anyway, so the small set is already close to filling it. */
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const size = coarse ? '-sm' : '';

  // One unit square, shared. Scale carries the size, so seven planes cost one
  // geometry between them.
  const quad = new PlaneGeometry(1, 1);

  const right = new Vector3();
  const up = new Vector3();
  const fwd = new Vector3();

  const items = PHOTOS.map((cfg, i) => {
    const chapter = CHAPTERS[i];

    const material = new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthTest: false,     // the photograph replaces the surface behind it
      depthWrite: false,
      // A photograph carries its own light and its own grade. Running it
      // through the scene's filmic tone map washes the highlights out, and
      // through the aerial fog — the first anchor sits 70m out, well inside
      // it — turns the golden hour grey.
      toneMapped: false,
      fog: false
    });

    const mesh = new Mesh(quad, material);
    mesh.visible = false;
    mesh.frustumCulled = false;        // it is always dead centre of the view
    mesh.renderOrder = 100 + i;        // over the villa, and in chapter order
    scene.add(mesh);

    return {
      cfg, chapter, mesh, material,
      aspect: 0,          // filled in when the image lands
      loaded: false,
      loading: false,
      // How far in front of the camera to sit. Far enough that it can never
      // land behind the near plane, close enough to stay well inside the far
      // plane at the widest field of view.
      depth: 6
    };
  });

  function load(item) {
    if (item.loading || item.loaded) return;
    item.loading = true;

    const img = new Image();
    img.decoding = 'async';
    img.alt = '';

    const done = () => {
      if (!img.naturalWidth) return;
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      // The plane always covers the frame, so the texture is only ever
      // magnified and the mipmap chain would be built and never sampled.
      // Skipping it saves a third of the video memory and the upload time.
      // magFilter's default is LinearFilter, which is what minFilter wants.
      tex.generateMipmaps = false;
      tex.minFilter = tex.magFilter;
      tex.needsUpdate = true;

      item.aspect = img.naturalWidth / img.naturalHeight;
      item.material.map = tex;
      item.material.needsUpdate = true;
      item.loaded = true;
      if (onReady) onReady();
    };

    img.onload = () => {
      // decode() keeps the first paint of a 1472px JPEG off the main thread.
      // Not universally implemented, hence the fallback.
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    img.onerror = () => { item.loading = false; };   // silent: the villa stands in

    img.src = base + item.cfg.file + size + ext;
  }

  /* Fetch the first one now — it is the top of the page — and let the rest
     come in as the visitor approaches them. */
  load(items[0]);

  /* ------------------------------------------------------------------------
     Per-frame update. Called from the draw loop after the camera has been
     positioned, aimed and (on a portrait phone) tilted, so that the axis and
     the field of view read here are the final ones.
     ------------------------------------------------------------------------ */
  function update(t, fovScale) {
    const q = camera.quaternion;
    right.set(1, 0, 0).applyQuaternion(q);
    up.set(0, 1, 0).applyQuaternion(q);
    fwd.set(0, 0, -1).applyQuaternion(q);

    let covered = false;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const c = it.chapter;
      const span = c.to - c.from;
      const local = clamp01((t - c.from) / span);

      if (!it.loaded && !it.loading && t >= c.from - LOOKAHEAD) load(it);

      // A photograph is on screen from half a dissolve before its chapter to
      // half a dissolve after it — except that it also has to stay up if its
      // successor has not arrived yet, or the villa would flash through the
      // gap on a slow connection.
      const next = items[i + 1];
      const holdOn = next && !next.loaded;
      const from = c.from - BAND;
      const to = holdOn ? Infinity : c.to + BAND;

      if (t < from || t > to || !it.loaded) {
        if (it.mesh.visible) it.mesh.visible = false;
        continue;
      }

      // Of any two neighbours the later one carries the dissolve and the
      // earlier one holds solid underneath it (see the header). So every
      // photograph fades in over its leading band and then simply stays up
      // until the next one has covered it. The first has no predecessor to
      // dissolve over, so it is up from the very top of the page.
      const alpha = i === 0 ? 1 : clamp01(smoothstep((t - from) / (2 * BAND)));

      if (alpha <= 0.001) {
        if (it.mesh.visible) it.mesh.visible = false;
        continue;
      }
      if (alpha >= 0.999) covered = true;

      // ---- Solve the cover ----
      // The frame the camera can actually see, at the depth the plane sits.
      const vFov = camera.fov * DEG;                       // already fov * fovScale
      const visH = 2 * it.depth * Math.tan(vFov / 2);
      const visW = visH * camera.aspect;

      // The smallest plane that still covers it, then the push in.
      const coverH = Math.max(visH, visW / it.aspect);
      const zoom = ZOOM_MIN + (ZOOM_MAX - ZOOM_MIN) * smoothstep(local);
      const planeH = coverH * zoom;
      const planeW = planeH * it.aspect;

      // Whatever is left over is how far the picture may slide before an edge
      // would come into frame. `focus` spends it.
      const slackY = Math.max(0, (planeH - visH) * 0.5);
      const slackX = Math.max(0, (planeW - visW) * 0.5);
      const dy = it.cfg.focus * slackY;
      const dx = it.cfg.focusX * slackX;

      const m = it.mesh;
      m.visible = true;
      m.quaternion.copy(q);              // square to the screen, tilt included
      m.position.copy(camera.position)
        .addScaledVector(fwd, it.depth)
        .addScaledVector(right, dx)
        .addScaledVector(up, dy);
      m.scale.set(planeW, planeH, 1);
      it.material.opacity = alpha;
    }

    // fovScale is passed in for readability at the call site; camera.fov has
    // already been multiplied by it, so there is nothing to do with it here.
    void fovScale;

    // True when at least one photograph is at full opacity, which — since
    // every one of them is solved to cover the frame — means nothing behind
    // it can possibly be seen. The caller uses it to stop drawing the villa.
    return covered;
  }

  /* Alt text, for the static fallback and for anyone building a gallery from
     the same source of truth later. */
  const meta = PHOTOS.map((p, i) => ({
    file: p.file, alt: p.alt, chapter: CHAPTERS[i].id
  }));

  function dispose() {
    items.forEach((it) => {
      if (it.material.map) it.material.map.dispose();
      it.material.dispose();
      scene.remove(it.mesh);
    });
    quad.dispose();
  }

  return { update, dispose, meta, count: items.length };
}

export { PHOTOS };
