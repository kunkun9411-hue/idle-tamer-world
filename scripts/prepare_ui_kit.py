"""Build deterministic runtime variants for the modular Silver Ether UI kit."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-source" / "generated" / "ui-kit-v1" / "transparent"
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "assets" / "ui" / "kit"
MANIFEST_PATH = OUTPUT_DIR / "ui-kit-manifest.json"

ITEMS = [
    {
        "id": "A01",
        "family": "frame",
        "name": "Große universelle Rahmenecke",
        "source": "frame-corner-large-silver-ether-v1-master.png",
        "output": "frame/corner-large-v1.webp",
        "target": (512, 512),
        "padding": 8,
        "rotatable": True,
        "connections": ["right", "bottom"],
        "status": "approved",
    },
    {
        "id": "A02",
        "family": "frame",
        "name": "Dicke horizontale Rahmenkante",
        "source": "frame-edge-thick-horizontal-silver-ether-v1-master.png",
        "output": "frame/edge-thick-horizontal-v1.webp",
        "target": (1024, 192),
        "padding": 8,
        "rotatable": True,
        "connections": ["left", "right"],
        "status": "approved",
    },
    {
        "id": "A03",
        "family": "frame",
        "name": "Dicke vertikale Rahmenkante",
        "source": "frame-edge-thick-horizontal-silver-ether-v1-master.png",
        "output": "frame/edge-thick-vertical-v1.webp",
        "target": (192, 1024),
        "padding": 8,
        "rotation": 90,
        "rotatable": True,
        "connections": ["top", "bottom"],
        "status": "approved",
        "derivation": "rotate-90-from-A02",
    },
    {
        "id": "A04",
        "family": "frame",
        "name": "Dünne horizontale Rahmenkante",
        "source": "frame-edge-thin-horizontal-silver-ether-v1-master.png",
        "output": "frame/edge-thin-horizontal-v1.webp",
        "target": (1024, 64),
        "padding": 6,
        "rotatable": True,
        "connections": ["left", "right"],
        "status": "approved",
    },
    {
        "id": "A05",
        "family": "frame",
        "name": "Dünne vertikale Rahmenkante",
        "source": "frame-edge-thin-horizontal-silver-ether-v1-master.png",
        "output": "frame/edge-thin-vertical-v1.webp",
        "target": (64, 1024),
        "padding": 6,
        "rotation": 90,
        "rotatable": True,
        "connections": ["top", "bottom"],
        "status": "approved",
        "derivation": "rotate-90-from-A04",
    },
]


def fit_alpha(source: Path, destination: Path, target: tuple[int, int], padding: int, rotation: int = 0) -> None:
    with Image.open(source) as original:
        image = original.convert("RGBA")
        if rotation:
            image = image.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
        bounds = image.getchannel("A").getbbox()
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
        canvas.save(destination, "WEBP", quality=92, method=6, exact=True)


def runtime_entry(item: dict[str, object], output: Path) -> dict[str, object]:
    with Image.open(output) as image:
        width, height = image.size
        alpha = "A" in image.mode
    return {
        "id": item["id"],
        "family": item["family"],
        "name": item["name"],
        "path": f"/assets/ui/kit/{item['output']}",
        "source": f"art-source/generated/ui-kit-v1/transparent/{item['source']}",
        "width": width,
        "height": height,
        "alpha": alpha,
        "bytes": output.stat().st_size,
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "rotatable": item["rotatable"],
        "connections": item["connections"],
        "status": item["status"],
        "derivation": item.get("derivation"),
    }


def main() -> None:
    entries: list[dict[str, object]] = []
    for item in ITEMS:
        source = SOURCE_DIR / str(item["source"])
        destination = OUTPUT_DIR / str(item["output"])
        if not source.exists():
            raise FileNotFoundError(source)
        fit_alpha(source, destination, tuple(item["target"]), int(item["padding"]), int(item.get("rotation", 0)))
        entries.append(runtime_entry(item, destination))
        print(f"{item['id']} {source.name} -> {destination.relative_to(ROOT)}")

    payload = {"kitVersion": 1, "style": "silver-ether", "elements": entries}
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"UI kit manifest: {len(entries)} elements -> {MANIFEST_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
