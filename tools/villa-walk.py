#!/usr/bin/env python3
"""
Ermis' Villas — prepare the walk-through photographs.

Seven photographs of ONE house, in the order the camera walks them:

    1  20097  the house across the pool, from behind the stone wall
    2  20093  the terrace, facing the house
    3  20098  the shaded seating against the stone wall
    4  20110  the living room, looking out to the pool and the sea
    5  20112  the dining table, looking through to the terrace
    6  20113  the kitchen
    7  20116  the bedroom

The order is not arbitrary and it is not a slideshow order. Photograph 4
looks out at the pool that 1-3 stand beside, and photograph 5 looks back
through to the stone wall of 3, so the route closes on itself the way the
house does. Where one photograph contains an opening onto the next — the
sliding doors in 4, the terrace opening in 5 — the hero passes the camera
through that opening rather than dissolving.

    python3 tools/villa-walk.py

What it does:

  1. Writes WebP and JPEG at two widths. Video memory is the constraint
     rather than bandwidth: a texture costs width x height x 4 bytes
     whatever the file weighed, so phones get the smaller set.

  2. For the opening frame only, writes an extra RGBA cut-out with the sky
     knocked out. The hero draws the full photograph, then the villa's name,
     then this cut-out on top — so the type sits behind the roofline and the
     building genuinely occludes it. See js/hero/walk.js.

     The sky is found rather than hand-masked: on this photograph it is the
     only large region that is strongly blue (blue channel well above red)
     and bright. The mask is then feathered by a couple of pixels so the
     edge does not alias against the type.

⚠️  These photographs came from a listing or agency site. They are NOT
    cleared for publication. See README -> "Photography".
"""

import io
import os
import sys

try:
    import numpy as np
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Needs Pillow and numpy:  pip install pillow numpy")

SRC = "assets"
OUT = "assets/img/walk"

# In walking order. `name` is what the hero asks for.
PHOTOS = [
    ("01", "villa_682_20097.1920.jpg"),   # the approach
    ("02", "villa_682_20093.1920.jpg"),   # the terrace
    ("03", "villa_682_20098.1920.jpg"),   # the shaded seating
    ("04", "villa_682_20110.1920.jpg"),   # the living room
    ("05", "villa_682_20112.1920.jpg"),   # the dining table
    ("06", "villa_682_20113.1920.jpg"),   # the kitchen
    ("07", "villa_682_20116.1920.jpg"),   # the bedroom
]

# The small set is for phones, and it is 1200 rather than the 900 it started
# at because of what a portrait frame does to a 16:9 photograph. The hero fits
# each picture to the frame by height, so a phone held upright sees only about
# a quarter of the picture's width — and then the walk magnifies that by two
# again by the end of a chapter. At 900 the last room arrived as a blur. 1200
# costs about 23MB of video memory across all seven, against 13MB at 900,
# which is a fair trade on any phone made this decade; 1600 would be 40MB and
# is not.
WIDTHS = {"": 1600, "-sm": 1200}
JPEG_Q = 86
WEBP_Q = 82


def load(path):
    im = Image.open(path)
    im = im.convert("RGB")
    return im


def write_sizes(im, stem):
    for suffix, width in WIDTHS.items():
        if im.width <= width:
            small = im.copy()
        else:
            h = round(im.height * width / im.width)
            small = im.resize((width, h), Image.LANCZOS)
        # A light unsharp after a downscale, which always softens a little.
        small = small.filter(ImageFilter.UnsharpMask(radius=1.1, percent=48, threshold=3))
        small.save(f"{OUT}/{stem}{suffix}.jpg", "JPEG", quality=JPEG_Q,
                   optimize=True, progressive=True)
        small.save(f"{OUT}/{stem}{suffix}.webp", "WEBP", quality=WEBP_Q, method=6)
        print(f"  {stem}{suffix}  {small.width}x{small.height}")


def sky_cutout(im, stem):
    """The photograph with the sky made transparent.

    Drawn on top of the full photograph with the villa's name between the
    two, so the building occludes the type. Only the opening frame needs it.
    """
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # Sky here is deep blue and bright: blue clearly ahead of red, and not
    # dark. The white render of the house is bright but has r ~= b, so it
    # fails the first test; the stone wall and the hills fail both.
    sky = (b - r > 38) & (b > 110)

    # The pool is blue too, and passes that test. Sky is the thing that
    # reaches the top of the frame, so keep only the run of sky that starts
    # at the top of each column and stop at the first pixel that is not:
    # everything below the roofline, the hills and the water is excluded by
    # construction rather than by another colour rule that could misfire.
    sky = np.logical_and.accumulate(sky, axis=0)

    m = Image.fromarray((sky * 255).astype(np.uint8), "L")
    # Close pinholes (the odd bright cloud edge), then feather.
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    m = m.filter(ImageFilter.GaussianBlur(1.6))

    pct = 100.0 * np.asarray(m).mean() / 255.0
    print(f"  sky mask covers {pct:.1f}% of the frame")
    if not (12 < pct < 72):
        print("  ⚠️  that is outside the range this was tuned for — check the "
              "cut-out before trusting it")

    alpha = Image.eval(m, lambda v: 255 - v)          # keep everything BUT sky
    for suffix, width in WIDTHS.items():
        if im.width <= width:
            base, mask = im.copy(), alpha.copy()
        else:
            h = round(im.height * width / im.width)
            base = im.resize((width, h), Image.LANCZOS)
            mask = alpha.resize((width, h), Image.LANCZOS)
        cut = base.convert("RGBA")
        cut.putalpha(mask)
        cut.save(f"{OUT}/{stem}-cut{suffix}.png", "PNG", optimize=True)
        print(f"  {stem}-cut{suffix}  {cut.width}x{cut.height}")


def main():
    os.makedirs(OUT, exist_ok=True)
    missing = [f for _, f in PHOTOS if not os.path.exists(f"{SRC}/{f}")]
    if missing:
        sys.exit("Missing from assets/: " + ", ".join(missing))

    for stem, fname in PHOTOS:
        print(f"{fname}")
        im = load(f"{SRC}/{fname}")
        write_sizes(im, stem)
        if stem == "01":
            sky_cutout(im, stem)

    total = sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT))
    print(f"\n{len(os.listdir(OUT))} files, {total/1e6:.1f}MB in {OUT}/")


if __name__ == "__main__":
    main()
