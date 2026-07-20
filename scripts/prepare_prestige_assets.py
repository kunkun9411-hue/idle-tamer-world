from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-source" / "generated" / "prestige-v2"
OUTPUT_DIR = ROOT / "public" / "assets" / "prestige"
BACKGROUND_SIZE = (1600, 900)
CRYSTAL_SIZE = (512, 768)


def crop_to_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    current = width / height
    if current > ratio:
        target_width = round(height * ratio)
        left = (width - target_width) // 2
        return image.crop((left, 0, left + target_width, height))
    target_height = round(width / ratio)
    top = (height - target_height) // 2
    return image.crop((0, top, width, top + target_height))


def prepare_background() -> None:
    source = SOURCE_DIR / "prestige-sanctum-master.png"
    destination = OUTPUT_DIR / "prestige-sanctum-v2.webp"
    with Image.open(source) as original:
        image = crop_to_ratio(original.convert("RGB"), 16 / 9)
        image = image.resize(BACKGROUND_SIZE, Image.Resampling.LANCZOS)
        image = ImageEnhance.Contrast(image).enhance(1.025)
        image = ImageEnhance.Brightness(image).enhance(0.9)
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=82, method=6)
    print(f"{source.name} -> {destination.relative_to(ROOT)} {BACKGROUND_SIZE}")


def prepare_crystal() -> None:
    source = SOURCE_DIR / "ether-crystal-master.png"
    destination = OUTPUT_DIR / "ether-crystal-v2.png"
    with Image.open(source) as original:
        image = original.convert("RGBA")
        alpha_box = image.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"{source}: no visible crystal pixels")
        image = image.crop(alpha_box)
        image.thumbnail((CRYSTAL_SIZE[0] - 48, CRYSTAL_SIZE[1] - 48), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", CRYSTAL_SIZE, (0, 0, 0, 0))
        x = (CRYSTAL_SIZE[0] - image.width) // 2
        y = (CRYSTAL_SIZE[1] - image.height) // 2
        canvas.alpha_composite(image, (x, y))
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        canvas.save(destination, "PNG", optimize=True)
    print(f"{source.name} -> {destination.relative_to(ROOT)} {CRYSTAL_SIZE}")


def main() -> None:
    prepare_background()
    prepare_crystal()


if __name__ == "__main__":
    main()
