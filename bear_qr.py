"""Halftone bear QR for the cards: python bear_qr.py  ->  img/bear-qr.png

Each QR module is drawn as 5x5 dots. The middle 3x3 is the real data, the ring around it
follow a bear-head picture, so the bear shows through and phones still read the centers.
Finder/timing/alignment/format areas stay solid so scanners lock on fast. Error level H.
"""
import segno
from PIL import Image, ImageDraw

URL = "https://jrns-hub.github.io/bearly-technical/"
INK, PAPER = (11, 23, 51), (255, 255, 255)  # card navy on white
SUB, CORE, PX, BORDER = 5, 3, 5, 2  # dots per module side, data dots in the middle, pixels per dot, quiet modules

qr = segno.make(URL, error="h", version=7, boost_error=False)
m = [[bool(v) for v in row] for row in qr.matrix]
n = len(m)  # 45 for version 7


def is_function(r, c):
    if (r < 9 and c < 9) or (r < 9 and c >= n - 8) or (r >= n - 8 and c < 9):  # finders + format
        return True
    if r == 6 or c == 6:  # timing
        return True
    if (r < 6 and n - 11 <= c < n - 8) or (c < 6 and n - 11 <= r < n - 8):  # version info
        return True
    centers = (6, 22, 38)  # version 7 alignment patterns
    for ar in centers:
        for ac in centers:
            if (ar, ac) in ((6, 6), (6, 38), (38, 6)):
                continue
            if abs(r - ar) <= 2 and abs(c - ac) <= 2:
                return True
    return False


# bear head drawn at dot resolution, 1 = ink
S = n * SUB
art = Image.new("1", (S, S), 0)
d = ImageDraw.Draw(art)
cx, cy, R = S / 2, S * 0.56, S * 0.30
for ex in (cx - R * 0.78, cx + R * 0.78):  # ears
    d.ellipse([ex - R * 0.38, cy - R * 1.08, ex + R * 0.38, cy - R * 0.32], fill=1)
d.ellipse([cx - R, cy - R * 0.9, cx + R, cy + R * 0.95], fill=1)  # head
d.ellipse([cx - R * 0.42, cy + R * 0.05, cx + R * 0.42, cy + R * 0.62], fill=0)  # muzzle
d.ellipse([cx - R * 0.16, cy + R * 0.08, cx + R * 0.16, cy + R * 0.28], fill=1)  # nose
for ex in (cx - R * 0.38, cx + R * 0.38):  # eyes
    d.ellipse([ex - R * 0.11, cy - R * 0.38, ex + R * 0.11, cy - R * 0.16], fill=0)

side = (n + 2 * BORDER) * SUB * PX
img = Image.new("RGB", (side, side), PAPER)
p = ImageDraw.Draw(img)
for r in range(n):
    for c in range(n):
        for dy in range(SUB):
            for dx in range(SUB):
                y, x = r * SUB + dy, c * SUB + dx
                lo = (SUB - CORE) // 2
                center = lo <= dy < lo + CORE and lo <= dx < lo + CORE
                dark = m[r][c] if (center or is_function(r, c)) else art.getpixel((x, y))
                if dark:
                    X, Y = (x + BORDER * SUB) * PX, (y + BORDER * SUB) * PX
                    p.rectangle([X, Y, X + PX - 1, Y + PX - 1], fill=INK)
img.save("img/bear-qr.png")

if __name__ == "__main__":
    # self-check with zxing (the engine many phone scanners use): plain, blurred, tilted, dim
    import zxingcpp
    from PIL import ImageEnhance, ImageFilter
    g = img.convert("L")
    tests = {
        "small 150px": g.resize((150, 150), Image.LANCZOS),
        "blurred": g.resize((300, 300), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2)),
        "tilted 12deg": g.resize((400, 400), Image.LANCZOS).rotate(12, expand=True, fillcolor=255),
        "dim + low contrast": ImageEnhance.Contrast(g.resize((300, 300), Image.LANCZOS)).enhance(0.45),
    }
    bad = [k for k, t in tests.items() if URL not in [b.text for b in zxingcpp.read_barcodes(t)]]
    print("all scans ok" if not bad else f"FAILED: {bad}")
    assert not bad
