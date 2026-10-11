# Renders the five lower-third caption cards (cap1.png ... cap5.png) as full-frame
# transparent 1920x1080 PNGs. Needs Pillow and Outfit.ttf (the Google Fonts variable font).
from PIL import Image, ImageDraw, ImageFont, ImageFilter

TEAL = (31, 111, 139)
CORAL = (255, 111, 97)


def font(size, weight):
    f = ImageFont.truetype("Outfit.ttf", size)
    f.set_variation_by_axes([weight])
    return f


def card(eyebrow, parts, out, top=False):
    W, H = 1920, 1080
    fe, fh = font(26, 500), font(64, 300)
    tw = sum(fh.getlength(t) for t, _ in parts)
    ew = fe.getlength(eyebrow) + 0.2 * 26 * len(eyebrow)
    pad = 48
    cw, ch = int(max(tw, ew) + pad * 2), 48 + 34 + 18 + 72 + 40
    x0, y0 = 110, (110 if top else H - 110 - ch)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([x0, y0 + 14, x0 + cw, y0 + ch + 14], radius=32, fill=(20, 60, 80, 70))
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(26)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=32, fill=(251, 251, 253, 226), outline=(255, 255, 255, 255), width=2)
    x, y = x0 + pad, y0 + 44
    for c in eyebrow:  # Outfit 500, uppercase, 0.2em tracking, coral
        d.text((x, y), c, font=fe, fill=CORAL)
        x += fe.getlength(c) + 0.2 * 26
    x, y = x0 + pad, y0 + 44 + 34 + 18
    for t, col in parts:  # Outfit 300 teal headline with the coral full stop
        d.text((x, y), t, font=fh, fill=col)
        x += fh.getlength(t)
    img.save(out)


CAPTIONS = [
    ("THE AI ERA", "AI is moving fast"),
    ("SORTNOW LEARN", "Learn it in small pieces"),
    ("DAILY CHALLENGE · 5 MIN", "One puzzle a day"),
    ("SHORT LESSONS", "For beginners and managers"),
    ("PIECE BY PIECE", "Solve the puzzle. Get ahead"),
]
for i, (eyebrow, line) in enumerate(CAPTIONS, 1):
    # Scene 2's puzzle pieces sit low in frame, so its card goes top-left.
    card(eyebrow, [(line, TEAL), (".", CORAL)], f"cap{i}.png", top=(i == 2))
