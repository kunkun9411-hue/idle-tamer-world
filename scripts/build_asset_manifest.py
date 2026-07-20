"""Build the deterministic runtime asset contract consumed by tooling and the future API."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ASSET_ROOT = PUBLIC / "assets"
OUTPUT = ASSET_ROOT / "asset-manifest.json"
CONTENT_RELEASE_ID = "foundation-1.0.0"


def asset_kind(path: Path) -> str:
    group = path.relative_to(ASSET_ROOT).parts[0]
    return {
        "monsters": "monster",
        "enemies": "enemy",
        "bosses": "boss",
        "zones": "zone",
        "gems": "gem",
        "animations": "animation",
    }.get(group, group)


def describe(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        width, height = image.size
        mode = image.mode
        file_format = image.format.lower() if image.format else path.suffix.lstrip(".").lower()
    relative_path = path.relative_to(ASSET_ROOT)
    relative = path.relative_to(PUBLIC).as_posix()
    identity = ".".join(relative_path.with_suffix("").parts[1:])
    return {
        "id": f"{asset_kind(path)}.{identity}",
        "kind": asset_kind(path),
        "path": f"/{relative}",
        "format": file_format,
        "width": width,
        "height": height,
        "alpha": "A" in mode,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def main() -> None:
    paths = sorted(
        path
        for path in ASSET_ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in {".png", ".webp"}
    )
    payload = {
        "manifestVersion": 1,
        "contentReleaseId": CONTENT_RELEASE_ID,
        "assets": [describe(path) for path in paths],
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"asset manifest: {len(paths)} entries -> {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
