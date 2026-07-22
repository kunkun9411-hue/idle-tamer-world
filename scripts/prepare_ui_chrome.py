"""Prepare generated Silver Ether UI chrome for the browser runtime."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-source" / "generated" / "ui-chrome-v1" / "transparent"
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "assets" / "ui" / "chrome"


def fit_alpha(source: Path, destination: Path, target: tuple[int, int], padding: int) -> None:
    with Image.open(source) as original:
        image = original.convert("RGBA")
        alpha = image.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise ValueError(f"{source}: no visible pixels")

        image = image.crop(bounds)
        available = (target[0] - 2 * padding, target[1] - 2 * padding)
        scale = min(available[0] / image.width, available[1] / image.height)
        size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
        image = image.resize(size, Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", target, (0, 0, 0, 0))
        position = ((target[0] - size[0]) // 2, (target[1] - size[1]) // 2)
        canvas.alpha_composite(image, position)

        destination.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(destination, "WEBP", quality=90, method=6, exact=True)
        print(f"{source.name} -> {destination.relative_to(ROOT)} {canvas.size}")


def main() -> None:
    files = {
        "panel-frame-silver-ether-v1-master.png": ("panel-frame-v1.webp", (1024, 1024), 16),
        "primary-button-silver-ether-v1-master.png": ("primary-button-frame-v1.webp", (1024, 384), 16),
        "avatar-frame-silver-ether-v1-master.png": ("avatar-frame-v1.webp", (512, 512), 8),
        "ether-divider-silver-v1-master.png": ("ether-divider-v1.webp", (1024, 256), 16),
    }
    for source_name, (destination_name, target, padding) in files.items():
        source = SOURCE_DIR / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        fit_alpha(source, OUTPUT_DIR / destination_name, target, padding)


if __name__ == "__main__":
    main()
