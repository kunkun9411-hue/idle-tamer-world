"""Validate every committed Idle Tamer runtime creature asset."""

from __future__ import annotations

from pathlib import Path
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GROUPS = {
    "monsters": (ROOT / "public" / "assets" / "monsters", 10),
    "enemies": (ROOT / "public" / "assets" / "enemies", 30),
    "bosses": (ROOT / "public" / "assets" / "bosses", 5),
}
ZONE_BACKGROUNDS = ROOT / "public" / "assets" / "zones"
GEM_ROOT = ROOT / "public" / "assets" / "gems"
MANIFEST = ROOT / "public" / "assets" / "asset-manifest.json"


def validate(path: Path) -> None:
    with Image.open(path) as image:
        if image.size != (200, 200):
            raise ValueError(f"{path}: expected 200x200, got {image.size}")
        if image.mode != "RGBA":
            raise ValueError(f"{path}: expected RGBA, got {image.mode}")
        alpha = image.getchannel("A")
        if alpha.getbbox() is None:
            raise ValueError(f"{path}: no visible pixels")
        corners = [alpha.getpixel(point) for point in ((0, 0), (199, 0), (0, 199), (199, 199))]
        if any(corners):
            raise ValueError(f"{path}: corners must be transparent")


def main() -> None:
    checked = 0
    for name, (directory, expected) in GROUPS.items():
        files = sorted(directory.glob("*_idle_*.png"))
        if len(files) != expected:
            raise ValueError(f"{name}: expected {expected} runtime assets, found {len(files)}")
        for path in files:
            validate(path)
        checked += len(files)
        print(f"{name}: {len(files)} valid")
    zone_files = sorted(ZONE_BACKGROUNDS.glob("*-v2.webp"))
    if len(zone_files) != 3:
        raise ValueError(f"zones: expected 3 V2 backgrounds, found {len(zone_files)}")
    for path in zone_files:
        with Image.open(path) as image:
            if image.size != (1600, 900):
                raise ValueError(f"{path}: expected 1600x900, got {image.size}")
            if image.mode != "RGB":
                raise ValueError(f"{path}: expected RGB, got {image.mode}")
    print(f"zones: {len(zone_files)} valid 1600x900 WebP backgrounds")
    gem_files = sorted(GEM_ROOT.glob("*/*.png"))
    if len(gem_files) != 45:
        raise ValueError(f"gems: expected 45 runtime assets, found {len(gem_files)}")
    for path in gem_files:
        validate(path)
    print(f"gems: {len(gem_files)} valid transparent 200x200 assets")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    actual_paths = {
        f"/{path.relative_to(ROOT / 'public').as_posix()}"
        for path in (ROOT / "public" / "assets").rglob("*")
        if path.is_file() and path.suffix.lower() in {".png", ".webp"}
    }
    manifest_paths = {asset["path"] for asset in manifest["assets"]}
    if manifest.get("manifestVersion") != 1 or manifest.get("contentReleaseId") != "foundation-1.0.0":
        raise ValueError("asset manifest: unsupported version or content release")
    if manifest_paths != actual_paths:
        raise ValueError(f"asset manifest: path mismatch (missing={actual_paths - manifest_paths}, stale={manifest_paths - actual_paths})")
    print(f"manifest: {len(manifest_paths)} paths match runtime assets")
    print(f"total: {checked} transparent creature assets + {len(zone_files)} zone backgrounds + {len(gem_files)} Gems")


if __name__ == "__main__":
    main()
