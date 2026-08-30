/* ==========================================================================
   Ermis' Villas — the villa's surfaces, cut from the photographs
   --------------------------------------------------------------------------
   The hero is the modelled villa and the camera flight it always was. What
   changed is that the model is no longer painted in flat colours picked by
   hand: every surface it wears is a patch of the real house, cut out of the
   photographs by tools/villa-skin.py.

   So the render is that render, the stone is that stone, the terrace is that
   terrace, the pool is that water. The shapes are the model's; the substance
   is photographic.

   Three things this file has to get right:

   TILING. A texture repeats across a surface, and how many times decides
   whether a wall reads as plaster or as wallpaper. The repeat counts below
   are per material rather than per mesh, because a material is shared by
   every mesh that uses it — so they are a compromise, chosen for the largest
   surface each one lands on. Ground and sea get big numbers because those
   planes are 300 and 900 units across.

   TINT. A MeshStandardMaterial multiplies its map by its colour, so a map on
   a material that kept its old colour comes out doubly tinted and muddy.
   Everything here is therefore set to white and lets the photograph speak.
   The exceptions are the pairs the model needs to keep apart — dark timber
   from light, cypress from olive, a shadowed stone wall from a sunlit one —
   and those are multiplied by a NEUTRAL grey, so they are the same
   photograph darker rather than the same photograph recoloured.

   WAKING. These arrive over the network, long after the first frame is on
   screen, and the render loop has almost certainly shut itself down by then.
   Every load calls back so it can be woken.
   ========================================================================== */

import { Texture, SRGBColorSpace } from '../vendor/three.slim.js?v=260830a';

/* three.RepeatWrapping. The slim bundle exports geometry and materials but
   not the wrapping constants, and these are plain integers in three.js with
   a stable public value, so the number is used directly rather than growing
   the bundle for it. ClampToEdge is 1001 and Mirrored is 1002, for whoever
   needs them next. */
const REPEAT_WRAP = 1000;

/* material : [ texture, repeat, tint ]

   tint is a multiplier, white unless the model needs two materials to stay
   distinguishable while sharing one photograph. */
const SKIN = {
  // ---- the building ---------------------------------------------------
  plaster:  ['plaster',  10.0, 0xFFFFFF],
  plasterI: ['plasterin', 8.0, 0xFFFFFF],
  concrete: ['paving',   12.0, 0xFFFFFF],
  stone:    ['stone',     4.0, 0xFFFFFF],
  stoneDk:  ['stone',     4.0, 0x8C8C8C],   // the same wall, in shadow
  steel:    ['metal',     3.0, 0xFFFFFF],
  timber:   ['wood',      4.0, 0xFFFFFF],
  timberDk: ['wood',      4.0, 0x8A8A8A],
  /* The soffit was modelled as timber, and in these photographs it is not:
     every ceiling in this house is white-painted beams. The answer given was
     that where the model and the photographs disagree the photographs win,
     so it is painted. */
  soffit:   ['plasterin', 6.0, 0xEDE7DC],
  floor:    ['floor',    10.0, 0xFFFFFF],

  /* Brass keeps a tint, and it is the one place in this file that is not
     purely photographic. There is no brass in any of the seven photographs —
     the fittings in this house are all stainless — so the door pull and the
     handrail wear the stainless patch under a warm multiplier. They are a
     few centimetres of the frame; the alternative was inventing a colour,
     which is what this whole file exists to stop doing. */
  brass:    ['metal',     3.0, 0xB08D57],

  // ---- what is in the rooms -------------------------------------------
  fabric:   ['linen',     6.0, 0xFFFFFF],
  fabricDk: ['linen',     6.0, 0x8C8C8C],
  rug:      ['weave',     6.0, 0xFFFFFF],

  // ---- the grounds -----------------------------------------------------
  /* The planting all comes off one plant, because one plant is what the
     photographs contain. Cypress is the same leaf held down hard, which is
     near enough true of a cypress at this distance.

     These four are the one place the tints are not neutral. A green leaf
     multiplied by white stays the leaf's own green, which on a whole avenue
     of cypresses is a saturated municipal green nothing on this coast is;
     multiplied by a muted grey-green it settles into olive and scrub. It is
     the same photograph, desaturated, which is what distance does anyway. */
  cypress:  ['foliage',   4.0, 0x6E7A66],
  olive:    ['foliage',   4.0, 0x9AA08C],
  leaf:     ['foliage',   4.0, 0x8A9680],
  leafLt:   ['foliage',   4.0, 0xB6BCA6],
  trunk:    ['wood',      3.0, 0x9A9A9A],

  /* The ground was a lawn, which is a northern European garden and not this
     island. It is the pale dry ground the house actually stands on now, taken
     off the terrace and knocked back — the hillside patch was tried here
     first and read as wet rock, because a hillside seen from a kilometre away
     is not what the ground looks like underfoot. */
  grass:    ['paving',   45.0, 0xBEB2A2],
  gravel:   ['paving',   30.0, 0xFFFFFF],

  // ---- water ------------------------------------------------------------
  water:    ['water',     6.0, 0xFFFFFF],
  sea:      ['sea',      30.0, 0xFFFFFF],

  // ---- glazing ----------------------------------------------------------
  glass:    ['glazing',   2.0, 0xFFFFFF],
  glassDk:  ['glazing',   2.0, 0xFFFFFF]
};

/* Emissive fittings — glow, glowWarm, ember, wineGlow — are deliberately not
   in that table. They are not surfaces, they are light: a lit shade, a fire,
   a backlit bottle. There is no photograph of light, and mapping one onto a
   lamp would only stop it reading as lit. */

export function skinVilla(mats, onReady) {
  const shared = new Map();   // 'file@repeat' -> Texture, so each uploads once
  let pending = 0;

  for (const name of Object.keys(SKIN)) {
    const mat = mats[name];
    if (!mat) continue;                       // a material that no longer exists
    const [file, repeat, tint] = SKIN[name];
    const key = file + '@' + repeat;

    let tex = shared.get(key);
    if (!tex) {
      tex = load(file, repeat);
      shared.set(key, tex);
    }

    mat.map = tex;
    mat.color.setHex(tint);
    mat.needsUpdate = true;                   // the shader gains a map: recompile
  }

  function load(file, repeat) {
    const tex = new Texture();
    tex.colorSpace = SRGBColorSpace;
    tex.wrapS = tex.wrapT = REPEAT_WRAP;
    tex.repeat.set(repeat, repeat);

    /* Mipmaps ON here, unlike everywhere else in this hero. These are the one
       kind of texture in the project that is genuinely MINIFIED — a hillside
       tiled twenty-four times across three hundred units is a few texels per
       pixel at the far end of the drive, and without a mipmap chain that
       aliases into a crawling shimmer the moment the camera moves. */

    const img = new Image();
    img.decoding = 'async';
    pending++;
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
      if (--pending === 0 && onReady) onReady();
      else if (onReady) onReady();
    };
    img.onerror = () => {
      /* A missing patch leaves the material with its map unset and its tint
         showing, which is a flat colour — the thing this file replaced, but
         a perfectly reasonable thing to fall back to. Nothing throws and the
         flight is unaffected. */
      pending--;
      mapFailed(file);
    };
    img.src = `assets/img/skin/${file}.jpg`;
    return tex;
  }

  /* Two materials need more than a map.

     The pool and the sea were built as near-mirrors — roughness 0.045,
     metalness 0.62 — because a modelled pool with nothing in it has only the
     sky to show, and a mirror was the cheapest way to make it interesting.
     With a photograph of real water on them that is now backwards: a mirror
     reflects the sky and shows almost none of its own map, so the pool came
     out the navy of the sky above it instead of the turquoise it is in every
     photograph. Roughened and de-metalled, the water's own colour carries and
     the sky becomes a sheen on top of it, which is the right way round. */
  if (mats.water) {
    mats.water.roughness = 0.20;
    mats.water.metalness = 0.14;
    mats.water.envMapIntensity = 0.95;
    mats.water.needsUpdate = true;
  }
  if (mats.sea) {
    mats.sea.roughness = 0.30;
    mats.sea.metalness = 0.16;
    mats.sea.envMapIntensity = 0.90;
    mats.sea.needsUpdate = true;
  }

  return { count: shared.size };
}

let warned = false;
function mapFailed(file) {
  if (warned) return;                   // one line, not fourteen
  warned = true;
  console.warn(
    `[hero] a surface texture failed to load (${file}.jpg and possibly others). ` +
    `The villa falls back to flat colour. Run tools/villa-skin.py.`
  );
}
