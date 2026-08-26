#!/usr/bin/env python3
"""
Ermis' Villas — prepare the seven hero photographs.

The originals live in assets/ as they were uploaded (736px on the long edge,
two of them carrying someone else's watermark). This turns them into the set
the 3D hero actually loads, and is the only thing that should ever write to
assets/img/hero/ — edit here and re-run, don't hand-edit the output.

    python3 tools/hero-photos.py

What it does, and why:

  1. Trims the two watermarks. The crop boxes below were measured, not
     guessed: the watermark is bright text over smooth background, so it
     shows as a spike in per-row bright-pixel count. Nothing else is cropped.
     Framing for a given screen shape is done at render time by scaling the
     photo past the edges of the frame, so the file always holds the whole
     picture.

  2. Upscales 2x with Lanczos and a mild unsharp mask. This adds no detail —
     nothing can — but the GPU would otherwise magnify a 736px texture with
     bilinear filtering, which is visibly mushier than a good resample plus a
     little edge contrast. It is the difference between "soft" and "blurry".

  3. Writes WebP and JPEG at two sizes, because video memory is the real
     constraint here rather than bandwidth. Seven textures stay resident once
     they have been scrolled past, and a texture costs width x height x 4
     bytes whatever the file weighed: 10MB each for the large set, 5MB for the
     small one. Phones get the small one. A tab that reloads itself halfway
     down the page is not a sharper photograph.

Re-run it after replacing any original. If you upload larger originals, set
the scale factors below to 1 — the point of them is to compensate for small
sources, and upscaling something already big just wastes memory.
"""

import os
import sys

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Pillow is needed: pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "hero")

# (suffix, scale, quality). 1.75x lands a 736px original at 1288px, which is
# enough to stop a 1440px browser window magnifying it much, without paying
# for the 2x set that would put seven resident textures at 115MB.
SIZES = [
    ("",    1.75, 82),   # laptops and desktops
    ("-sm", 1.20, 80),   # phones and tablets, and the no-JavaScript fallback
]

# source file, output stem, crop box (or None), one line on what it is.
#
# crop is (left, top, right, bottom) in original pixels. Only ever used to
# remove a watermark — see the module docstring.
PHOTOS = [
    ("Ermis Villas hero no 1.jpg", "01", (0, 0, 736, 1044),
     "The house from across the pool at golden hour. "
     "Bottom 60px removed: TheBrainAndTheBrawn.com watermark, rows 1049-1072."),

    ("ermis villas hero no 2.jpg", "02", None,
     "The approach at dusk, lit path to the door."),

    ("ermis vills hero no 3.jpg", "03", None,
     "The front door, head on."),

    ("ermis villas hero no 4.jpg", "04", None,
     "The great room, double height, arched glazing."),

    ("ermis villas hero no 5.jpg", "05", None,
     "The living room and fireplace in the evening. The one landscape frame."),

    ("ermis villas hero no 6.jpg", "06", (0, 0, 736, 1016),
     "The kitchen, olive tree, sun going down over the hills. "
     "Bottom 88px removed: Pinterest 'FOLLOW MMV_TRADES' overlay, rows 1022-1078."),

    ("ermis villas hero no 7.jpg", "07", None,
     "The bedroom, sea and sunset through the glass."),
]


def build(src_name, stem, crop, note):
    src = os.path.join(ROOT, "assets", src_name)
    if not os.path.exists(src):
        sys.exit("missing original: " + src)

    im = Image.open(src)
    im = im.convert("RGB")          # drops any alpha and any embedded profile
    ow, oh = im.size

    if crop:
        im = im.crop(crop)

    cw, ch = im.size
    written = []

    for suffix, scale, quality in SIZES:
        w, h = round(cw * scale), round(ch * scale)
        out = im
        if (w, h) != (cw, ch):
            out = im.resize((w, h), Image.LANCZOS)
            # Gentle. Enough to put an edge back on the tile lines and the
            # window mullions; not enough to draw a halo round the doorframe.
            out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=3))

        webp = os.path.join(OUT, stem + suffix + ".webp")
        jpg = os.path.join(OUT, stem + suffix + ".jpg")
        out.save(webp, "WEBP", quality=quality, method=6)
        out.save(jpg, "JPEG", quality=quality + 2, optimize=True, progressive=True)
        written.append((w, h, webp, jpg))

    print(f"{stem}  {ow}x{oh}" + (f" -> crop {cw}x{ch}" if crop else "") )
    for w, h, webp, jpg in written:
        print(f"      {w:5d}x{h:<5d}  webp {os.path.getsize(webp)//1024:4d}KB"
              f"   jpg {os.path.getsize(jpg)//1024:4d}KB")
    print(f"      {note}")
    return written


def main():
    os.makedirs(OUT, exist_ok=True)
    total_webp = 0
    for src_name, stem, crop, note in PHOTOS:
        for w, h, webp, jpg in build(src_name, stem, crop, note):
            if "-sm" not in webp:
                total_webp += os.path.getsize(webp)
    print(f"\ndesktop set, WebP: {total_webp // 1024}KB across {len(PHOTOS)} photographs")
    print("(loaded one at a time as the visitor scrolls, never all at once)")


if __name__ == "__main__":
    main()
