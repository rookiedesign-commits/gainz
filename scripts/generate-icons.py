#!/usr/bin/env python
# Erzeugt App-Icons aus dem Foto + "GAINZ"-Schriftzug (Climate Crisis, weiss).
# Benoetigt Pillow:  python -m pip install Pillow
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
SRC = ICONS / "DSC08083-Verbessert-NR.jpg"
FONT = Path(__file__).resolve().parent / "ClimateCrisis.ttf"
TEXT = "gainz"

# (Dateiname, Groesse, Text-Breite als Anteil der Icon-Breite)
# Maskable braucht mehr Rand (Safe-Zone ~80%), daher schmalerer Text.
TARGETS = [
    ("icon-512.png", 512, 0.86),
    ("icon-192.png", 192, 0.86),
    ("icon-maskable-512.png", 512, 0.66),
    ("apple-touch-icon.png", 180, 0.86),
]


def square(im):
    w, h = im.size
    s = min(w, h)
    return im.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))


def fit_font(draw, text, target_w):
    # Suche die Font-Groesse, deren Textbreite ~ target_w entspricht.
    lo, hi = 8, 4000
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        f = ImageFont.truetype(str(FONT), mid)
        w = draw.textbbox((0, 0), text, font=f, stroke_width=max(1, mid // 22))[2]
        if w <= target_w:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ImageFont.truetype(str(FONT), best)


def render(size, text_frac):
    base = square(Image.open(SRC)).convert("RGB").resize((size, size), Image.LANCZOS)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = fit_font(draw, TEXT, size * text_frac)
    stroke = max(1, font.size // 22)
    # zentrieren anhand der tatsaechlichen Glyphen-Box
    bbox = draw.textbbox((0, 0), TEXT, font=font, stroke_width=stroke)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    # weicher Schatten fuer Kontrast auf hellem Hintergrund
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text(
        (x, y + max(1, size // 170)), TEXT, font=font, fill=(0, 0, 0, 150),
        stroke_width=stroke, stroke_fill=(0, 0, 0, 150),
    )
    from PIL import ImageFilter
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(1, size // 120)))
    layer = Image.alpha_composite(layer, shadow)
    draw = ImageDraw.Draw(layer)
    draw.text(
        (x, y), TEXT, font=font, fill=(255, 255, 255, 255),
        stroke_width=stroke, stroke_fill=(0, 0, 0, 90),
    )
    return Image.alpha_composite(base.convert("RGBA"), layer).convert("RGB")


for name, size, frac in TARGETS:
    render(size, frac).save(ICONS / name)
    print("OK", name)
print("Icons erzeugt in", ICONS)
