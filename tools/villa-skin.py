#!/usr/bin/env python3
"""
Ermis' Villas — cut the villa's surfaces out of the photographs.

The hero is the code-drawn villa again: the same model, the same camera
flight, the same door and stair. What changed is that not one surface in it
is a flat colour any more. Every material the model wears — its render, its
stone, its timber, its floors, its water, its planting — is a patch cut from
a photograph of the real house.

    python3 tools/villa-skin.py

Three things happen to each patch, and all three matter:

  1. CROP a region that is only the material and nothing else. The crop
     boxes below are fractions of the source photograph, so they survive a
     re-export at a different size.

  2. FLATTEN the lighting out of it. This is the step that is easy to skip
     and impossible to get away with. A photograph of a wall in Mykonos at
     midday has the sun baked into it — one edge bright, the other in
     shadow. Tile that across a modelled wall and you get a repeating
     gradient that reads as corduroy. So each patch is divided by a heavily
     blurred copy of its own luminance, which removes everything at large
     scale and leaves the grain, the grout and the pores. The scene's own
     sun then lights it, once.

  3. MAKE IT TILE, by wrapping it onto itself and cross-fading rather than
     by mirroring it. Mirroring is the easy way to kill a seam and it was the
     first thing tried here; it also stamps a diamond of symmetry through
     every tile, and a wall of those reads as patterned wallpaper. See
     seamless().

⚠️  These photographs came from a listing or agency site. They are NOT
    cleared for publication. See README -> "Photography".
"""

import os
import sys

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Needs Pillow and numpy:  pip install pillow numpy")

SRC = "assets/img/walk"
OUT = "assets/img/skin"

# name: (source, x0, y0, x1, y1, size, flatten, contrast[, saturation])
#
# Boxes are fractions of the photograph. `size` is the final edge of the
# mirrored block, so the patch itself is half that.
#
# `flatten` is how hard the LARGE-scale lighting is divided out: 1.0 removes
# all of it, 0.0 leaves the photograph as it was. Water and sea keep more of
# their own modelling, because a pool with its gradient scrubbed out stops
# reading as water at all.
#
# `contrast` is what is left of the MID-scale variation afterwards, and it is
# the difference between plaster and wallpaper. Mirroring a patch into a 2x2
# block gives it a diamond symmetry; on a bold material like the stone wall
# that reads as masonry, but on a near-plain one like interior render it reads
# as a repeating medallion, and a ceiling tiled with medallions is the single
# most artificial thing this hero has ever put on screen. Pulling the plain
# materials most of the way to their own mean turns the motif back into grain,
# which is all a rendered wall has anyway.
CROPS = {
    # ---- the fabric of the building -------------------------------------
    # These boxes are tight on purpose. A crop that strays one percent into a
    # window reveal or a pool edge puts a hard dark band in the tile, and a
    # hard band mirrored four ways and repeated over a wall is the most
    # conspicuous thing in the frame.
    "plaster":  ("01", 0.45, 0.28, 0.56, 0.36, 512, 1.0, 0.34),  # sunlit render
    "plasterin":("04", 0.30, 0.27, 0.43, 0.46, 512, 1.0, 0.28),  # interior wall
    "stone":    ("01", 0.71, 0.22, 0.99, 0.80, 512, 0.85, 1.0),  # the terrace wall
    "paving":   ("01", 0.44, 0.80, 0.64, 0.87, 512, 1.0, 0.42),  # terrace floor
    "floor":    ("04", 0.605, 0.807, 0.726, 0.892, 512, 1.0, 0.40),  # interior floor
    "wood":     ("03", 0.44, 0.31, 0.528, 0.53, 256, 0.9, 0.75),  # the timber door
    "metal":    ("06", 0.816, 0.425, 0.917, 0.737, 256, 0.9, 0.5),  # the fridge
    "glazing":  ("01", 0.25, 0.60, 0.30, 0.70, 256, 0.6, 0.6),   # one dark pane

    # ---- what is in the rooms -------------------------------------------
    "linen":    ("04", 0.21, 0.62, 0.34, 0.78, 256, 1.0, 0.5),   # sofa
    "weave":    ("04", 0.02, 0.90, 0.17, 0.99, 256, 1.0, 0.7),   # the woven mat

    # ---- what is outside them -------------------------------------------
    "foliage":  ("04", 0.08, 0.36, 0.17, 0.48, 256, 0.95, 0.85, 0.45),  # the plant
    "scrub":    ("01", 0.03, 0.535, 0.16, 0.585, 256, 0.9, 0.55),  # the hillside
    "water":    ("02", 0.58, 0.68, 0.72, 0.78, 512, 0.45, 0.75),  # the pool, lit
    "sea":      ("04", 0.58, 0.503, 0.675, 0.528, 256, 0.5, 0.7),  # the sea
}

JPEG_Q = 90


def flatten(im, strength):
    """Divide out the large-scale lighting, keep the texture.

    Works on luminance only and rescales the three channels by the same
    factor, so the colour of the material survives untouched — flattening
    each channel independently grey-shifts anything with a strong hue, which
    on the stone wall turned warm limestone into wet concrete.
    """
    if strength <= 0:
        return im
    a = np.asarray(im).astype(np.float32)
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

    # A blur radius that is a fair fraction of the patch: anything smaller
    # starts eating the grain we are trying to keep.
    r = max(4, min(im.width, im.height) / 5.0)
    blur = np.asarray(
        Image.fromarray(lum.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(r))
    ).astype(np.float32)

    target = float(blur.mean())
    gain = target / np.maximum(blur, 4.0)
    gain = 1.0 + (gain - 1.0) * strength          # dial it back if asked
    out = np.clip(a * gain[..., None], 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGB")


def soften(im, keep):
    """Pull the patch toward its own mean, keeping `keep` of the variation.

    Applied after flattening, and aimed at a different thing: flatten removes
    the sun, this removes the pattern. A patch that is nearly uniform mirrors
    invisibly; one that still has mid-scale structure mirrors into a medallion
    and tiles into wallpaper.
    """
    if keep >= 1.0:
        return im
    a = np.asarray(im).astype(np.float32)
    mean = a.reshape(-1, 3).mean(axis=0)
    out = np.clip(mean + (a - mean) * keep, 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGB")


def desaturate(im, keep):
    """Pull colour toward grey, keeping `keep` of the saturation.

    One material needs this and it is the planting. The only greenery in
    these seven photographs is a banana plant three feet from a window, which
    is a vivid, wet, tropical green; an avenue of cypresses wearing it is a
    municipal park. Tinting it grey-green in the material does not help,
    because a tint multiplies and a saturated green multiplied by anything
    stays saturated. The saturation has to come out of the pixels.
    """
    if keep >= 1.0:
        return im
    a = np.asarray(im).astype(np.float32)
    lum = (a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    return Image.fromarray(np.clip(lum + (a - lum) * keep, 0, 255).astype(np.uint8), "RGB")


def evenness(im):
    """Standard deviation of the patch's LARGE-SCALE luminance.

    A crop that is one material has a smooth, near-constant blur; a crop that
    has strayed onto a window reveal, a mullion or the edge of a pool has two
    populations and a wide one. Every bad tile in the first three passes of
    this file would have been caught by this number, and none of them were,
    because they were being judged by eye one contact sheet at a time.
    """
    a = np.asarray(im.convert("L")).astype(np.float32)
    r = max(3, min(im.width, im.height) / 6.0)
    blur = np.asarray(
        Image.fromarray(a.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(r))
    ).astype(np.float32)
    return float(blur.std())


def seamless(im, size):
    """Make the patch tile with no seam AND no symmetry.

    The first version of this mirrored the patch into a 2x2 block, which is
    the easy way to kill a seam: every edge then meets its own reflection. It
    also puts a diamond of symmetry through the middle of every tile, and the
    eye finds regular symmetry faster than almost anything else — on screen
    the villa's ceilings and walls came out covered in repeating medallions,
    which read as patterned wallpaper and sank the whole idea.

    So instead the patch is wrapped onto itself and cross-faded: rolled by
    half its width and blended with a raised cosine that falls to zero at the
    edges, then the same again vertically. Both edges of the result are the
    same 50/50 mixture of the same two neighbouring columns, so they match
    exactly — and nothing is reflected, so there is no symmetry to spot. The
    cost is a little softening where the fade is strongest, which on grain is
    invisible.
    """
    a = np.asarray(im.resize((size, size), Image.LANCZOS)).astype(np.float32)
    t = np.linspace(0.0, 1.0, size, endpoint=False)
    w = (1.0 - np.cos(2.0 * np.pi * t)) / 2.0     # 0 at the edges, 1 in the middle

    a = a * w[None, :, None] + np.roll(a, size // 2, axis=1) * (1 - w)[None, :, None]
    a = a * w[:, None, None] + np.roll(a, size // 2, axis=0) * (1 - w)[:, None, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def mean_hex(im):
    a = np.asarray(im).astype(np.float32).reshape(-1, 3).mean(axis=0)
    return "#%02X%02X%02X" % tuple(int(round(v)) for v in a)


def main():
    os.makedirs(OUT, exist_ok=True)
    report = []

    for name, spec in CROPS.items():
        src, x0, y0, x1, y1, size, strength, contrast = spec[:8]
        sat = spec[8] if len(spec) > 8 else 1.0
        path = f"{SRC}/{src}.jpg"
        if not os.path.exists(path):
            sys.exit(f"Missing {path} — run tools/villa-walk.py first.")
        im = Image.open(path).convert("RGB")
        box = (round(x0 * im.width), round(y0 * im.height),
               round(x1 * im.width), round(y1 * im.height))
        patch = im.crop(box)
        if patch.width < 16 or patch.height < 16:
            sys.exit(f"{name}: crop is {patch.size}, too small to be a texture")

        spread = evenness(patch)
        if spread > 26:
            print(f"  ⚠️  {name}: crop spans light and dark by {spread:.0f} levels "
                  f"— it is probably straddling two different things. Draw the "
                  f"boxes on the photographs before trusting it.")

        patch = flatten(patch, strength)
        patch = soften(patch, contrast)
        patch = desaturate(patch, sat)
        tile = seamless(patch, size)
        tile.save(f"{OUT}/{name}.jpg", "JPEG", quality=JPEG_Q, optimize=True)
        report.append((name, src, tile.size[0], mean_hex(tile)))
        print(f"  {name:10s} <- {src}  {tile.size[0]}px  {mean_hex(tile)}")

    total = sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT))
    print(f"\n{len(os.listdir(OUT))} textures, {total/1e3:.0f}KB in {OUT}/")
    print("\nMean colours, for the fallback tints in js/hero/skin.js:")
    for name, src, _, hexv in report:
        print(f"  {name:10s} {hexv}")


if __name__ == "__main__":
    main()
