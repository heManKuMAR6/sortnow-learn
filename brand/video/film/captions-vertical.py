# Vertical (1080x1920) caption cards for the 9:16 cut. Same style as captions.py,
# centered, with the card's bottom edge 340 px above the frame edge so it clears
# the Reels/TikTok caption and button area. Needs Pillow and Outfit.ttf.
from PIL import Image, ImageDraw, ImageFont, ImageFilter

TEAL = (31, 111, 139)
CORAL = (255, 111, 97)


def font(size, weight):
    f = ImageFont.truetype("Outfit.ttf", size)
    f.set_variation_by_axes([weight])
    return f


def card(eyebrow, line, out):
    W, H = 1080, 1920
    fe, fh = font(28, 500), font(66, 300)
    tw = fh.getlength(line + ".")
    ew = fe.getlength(eyebrow) + 0.2 * 28 * (len(eyebrow) - 1)
    pad = 52
    cw, ch = int(max(tw, ew) + pad * 2), 52 + 36 + 20 + 76 + 46
    x0, y0 = (W - cw) // 2, H - 340 - ch
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([x0, y0 + 16, x0 + cw, y0 + ch + 16], radius=36, fill=(20, 60, 80, 80))
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(28)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=36, fill=(251, 251, 253, 230), outline=(255, 255, 255, 255), width=2)
    x, y = (W - ew) / 2, y0 + 50
    for c in eyebrow:
        d.text((x, y), c, font=fe, fill=CORAL)
        x += fe.getlength(c) + 0.2 * 28
    x, y = (W - tw) / 2, y0 + 50 + 36 + 20
    d.text((x, y), line, font=fh, fill=TEAL)
    d.text((x + fh.getlength(line), y), ".", font=fh, fill=CORAL)
    img.save(out)


CAPTIONS = [
    ("THE AI ERA", "AI is moving fast"),
    ("SORTNOW LEARN", "Learn it in small pieces"),
    ("DAILY CHALLENGE · 5 MIN", "One puzzle a day"),
    ("SHORT LESSONS", "For beginners and managers"),
    ("PIECE BY PIECE", "Solve the puzzle. Get ahead"),
]
for i, (eyebrow, line) in enumerate(CAPTIONS, 1):
    card(eyebrow, line, f"cap{i}.png")
