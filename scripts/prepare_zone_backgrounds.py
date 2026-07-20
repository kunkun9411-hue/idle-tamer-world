from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-source" / "generated" / "zone-backgrounds-v2"
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "assets" / "zones"
TARGET_SIZE = (1600, 900)


def crop_to_ratio(image: Image.Image, ratio: float) -> Image.Image:
    width, height = image.size
    current = width / height
    if abs(current - ratio) < 0.001:
        return image
    if current > ratio:
        target_width = round(height * ratio)
        left = (width - target_width) // 2
        return image.crop((left, 0, left + target_width, height))
    target_height = round(width / ratio)
    top = (height - target_height) // 2
    return image.crop((0, top, width, top + target_height))


def prepare(source: Path, destination: Path) -> None:
    with Image.open(source) as original:
        image = crop_to_ratio(original.convert("RGB"), 16 / 9)
        image = image.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        image = ImageEnhance.Contrast(image).enhance(1.03)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=88, method=6)
        print(f"{source.name} -> {destination.relative_to(ROOT)} {image.size}")


def main() -> None:
    files = {
        "violet-rim-v2-master.png": "violet-rim-v2.webp",
        "glass-gardens-v2-master.png": "glass-gardens-v2.webp",
        "obsidian-fjord-v2-master.png": "obsidian-fjord-v2.webp",
    }
    for source_name, destination_name in files.items():
        source = SOURCE_DIR / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        prepare(source, OUTPUT_DIR / destination_name)


if __name__ == "__main__":
    main()
