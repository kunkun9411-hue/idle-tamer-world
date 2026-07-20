"""Build the 45 transparent 200x200 runtime Gems from nine Imagegen masters."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art-source" / "generated" / "gems" / "transparent"
OUTPUT = ROOT / "apps" / "web" / "public" / "assets" / "gems"

COLORS = {
    "crimson": (228, 67, 82),
    "azure": (52, 151, 239),
    "jade": (52, 188, 124),
    "violet": (139, 91, 232),
    "amber": (232, 157, 45),
}
RARITIES = ("common", "rare", "mythic")
SHAPES = ("triangle", "square", "diamond")


def tint(master: Image.Image, color: tuple[int, int, int], rarity: str) -> Image.Image:
    rgba = master.convert("RGBA")
    alpha = rgba.getchannel("A")
    gray = ImageOps.grayscale(rgba)
    dark = tuple(max(2, round(channel * 0.055)) for channel in color)
    mapped = ImageOps.colorize(gray, black=dark, mid=color, white=(255, 253, 255), midpoint=118).convert("RGBA")
    mapped.putalpha(alpha)
    # More silver survives on framed Rare/Mythic Gems while the crystal remains readable.
    strength = {"common": 0.82, "rare": 0.72, "mythic": 0.67}[rarity]
    colored = Image.blend(rgba, mapped, strength)
    colored = ImageEnhance.Contrast(colored).enhance(1.08)
    colored.putalpha(alpha)
    return colored


def fit_icon(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("Master contains no visible pixels")
    cropped = image.crop(bbox)
    scale = min(176 / cropped.width, 176 / cropped.height)
    size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
    resized = cropped.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((200 - size[0]) // 2, (200 - size[1]) // 2))
    return canvas


def main() -> None:
    written = 0
    for rarity in RARITIES:
        target = OUTPUT / rarity
        target.mkdir(parents=True, exist_ok=True)
        for shape in SHAPES:
            source = SOURCE / f"{rarity}-{shape}.png"
            if not source.exists():
                raise FileNotFoundError(source)
            with Image.open(source) as master:
                for color_name, color in COLORS.items():
                    output = target / f"{shape}-{color_name}.png"
                    fit_icon(tint(master, color, rarity)).save(output, optimize=True)
                    written += 1
    print(f"Built {written} Gem assets in {OUTPUT}")


if __name__ == "__main__":
    main()
