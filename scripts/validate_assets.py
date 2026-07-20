"""Validate every committed Idle Tamer runtime creature asset."""

from __future__ import annotations

from pathlib import Path
import hashlib
import json

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "apps" / "web" / "public"
GROUPS = {
    "monsters": (PUBLIC / "assets" / "monsters", 10),
    "enemies": (PUBLIC / "assets" / "enemies", 30),
    "bosses": (PUBLIC / "assets" / "bosses", 5),
}
ZONE_BACKGROUNDS = PUBLIC / "assets" / "zones"
GEM_ROOT = PUBLIC / "assets" / "gems"
PRESTIGE_ROOT = PUBLIC / "assets" / "prestige"
EGG_ROOT = PUBLIC / "assets" / "eggs"
EFFECT_ROOT = PUBLIC / "assets" / "effects"
ITEM_ROOT = PUBLIC / "assets" / "items"
INCUBATOR_ROOT = PUBLIC / "assets" / "incubator"
MANIFEST = PUBLIC / "assets" / "asset-manifest.json"
ASSET_ROOT = PUBLIC / "assets"
EXPECTED_KIND_COUNTS = {"monster": 10, "enemy": 30, "boss": 5, "zone": 3, "gem": 45, "branding": 1, "prestige": 2, "egg": 11, "effect": 4, "item": 5, "incubator": 1}
MAX_BYTES = {"monster": 100_000, "enemy": 100_000, "boss": 100_000, "gem": 100_000, "zone": 500_000, "branding": 600_000, "prestige": 500_000, "egg": 100_000, "effect": 350_000, "item": 100_000, "incubator": 350_000}


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


def asset_kind(path: Path) -> str:
    return {
        "monsters": "monster",
        "enemies": "enemy",
        "bosses": "boss",
        "zones": "zone",
        "gems": "gem",
        "branding": "branding",
        "prestige": "prestige",
        "eggs": "egg",
        "effects": "effect",
        "items": "item",
        "incubator": "incubator",
    }[path.relative_to(ASSET_ROOT).parts[0]]


def expected_asset_id(path: Path) -> str:
    relative = path.relative_to(ASSET_ROOT).with_suffix("")
    return f"{asset_kind(path)}.{'.'.join(relative.parts[1:])}"


def validate_manifest_asset(asset: dict[str, object]) -> None:
    required = {"id", "kind", "path", "format", "width", "height", "alpha", "bytes", "sha256"}
    if set(asset) != required:
        raise ValueError(f"asset manifest: invalid fields for {asset.get('id')}: {set(asset) ^ required}")
    public_path = str(asset["path"]).lstrip("/")
    path = (PUBLIC / public_path).resolve()
    if ASSET_ROOT.resolve() not in path.parents or not path.is_file():
        raise ValueError(f"asset manifest: unsafe or missing path {asset['path']}")
    kind = asset_kind(path)
    with Image.open(path) as image:
        actual = {
            "id": expected_asset_id(path),
            "kind": kind,
            "path": f"/{path.relative_to(PUBLIC).as_posix()}",
            "format": image.format.lower() if image.format else path.suffix.lstrip(".").lower(),
            "width": image.width,
            "height": image.height,
            "alpha": "A" in image.mode,
            "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        }
    if asset != actual:
        mismatches = {key: (asset[key], actual[key]) for key in required if asset[key] != actual[key]}
        raise ValueError(f"asset manifest: stale metadata for {asset['id']}: {mismatches}")
    if actual["bytes"] > MAX_BYTES[kind]:
        raise ValueError(f"{path}: {actual['bytes']} bytes exceeds {MAX_BYTES[kind]} byte {kind} budget")


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
    prestige_files = sorted(PRESTIGE_ROOT.glob("*"))
    if {path.name for path in prestige_files} != {"prestige-sanctum-v2.webp", "ether-crystal-v2.png"}:
        raise ValueError(f"prestige: unexpected runtime assets {[path.name for path in prestige_files]}")
    with Image.open(PRESTIGE_ROOT / "prestige-sanctum-v2.webp") as image:
        if image.size != (1600, 900) or image.mode != "RGB":
            raise ValueError(f"prestige background: expected 1600x900 RGB, got {image.size} {image.mode}")
    with Image.open(PRESTIGE_ROOT / "ether-crystal-v2.png") as image:
        if image.size != (512, 768) or image.mode != "RGBA":
            raise ValueError(f"prestige crystal: expected 512x768 RGBA, got {image.size} {image.mode}")
        alpha = image.getchannel("A")
        if alpha.getbbox() is None:
            raise ValueError("prestige crystal: no visible pixels")
        corners = [alpha.getpixel(point) for point in ((0, 0), (511, 0), (0, 767), (511, 767))]
        if any(corners):
            raise ValueError("prestige crystal: corners must be transparent")
    print("prestige: 1600x900 RGB sanctum and transparent 512x768 crystal valid")
    egg_files = sorted(EGG_ROOT.glob("*.png"))
    if len(egg_files) != 11:
        raise ValueError(f"eggs: expected 11 runtime assets, found {len(egg_files)}")
    for path in egg_files:
        validate(path)
    print(f"eggs: {len(egg_files)} valid transparent 200x200 assets")
    item_files = sorted(ITEM_ROOT.glob("*.png"))
    if len(item_files) != 5:
        raise ValueError(f"items: expected 5 runtime assets, found {len(item_files)}")
    for path in item_files:
        validate(path)
    print(f"items: {len(item_files)} valid transparent 200x200 assets")
    effect_files = sorted(EFFECT_ROOT.glob("*/*.png"))
    if len(effect_files) != 4:
        raise ValueError(f"effects: expected 4 runtime assets, found {len(effect_files)}")
    for path in effect_files:
        with Image.open(path) as image:
            if image.size not in {(200, 200), (512, 512)} or image.mode != "RGBA":
                raise ValueError(f"{path}: expected 200x200 or 512x512 RGBA, got {image.size} {image.mode}")
            alpha = image.getchannel("A")
            corners = [alpha.getpixel(point) for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1))]
            if alpha.getbbox() is None or any(corners):
                raise ValueError(f"{path}: effect must be visible with transparent corners")
    print(f"effects: {len(effect_files)} valid transparent runtime layers")
    incubator_files = sorted(INCUBATOR_ROOT.glob("*.png"))
    if {path.name for path in incubator_files} != {"incubator-frame-v1.png"}:
        raise ValueError(f"incubator: unexpected runtime assets {[path.name for path in incubator_files]}")
    with Image.open(incubator_files[0]) as image:
        if image.size != (512, 512) or image.mode != "RGBA":
            raise ValueError(f"incubator: expected 512x512 RGBA, got {image.size} {image.mode}")
        alpha = image.getchannel("A")
        if alpha.getbbox() is None or any(alpha.getpixel(point) for point in ((0, 0), (511, 0), (0, 511), (511, 511))):
            raise ValueError("incubator: expected visible content with transparent corners")
    print("incubator: one transparent 512x512 frame valid")
    gem_files = sorted(GEM_ROOT.glob("*/*.png"))
    if len(gem_files) != 45:
        raise ValueError(f"gems: expected 45 runtime assets, found {len(gem_files)}")
    for path in gem_files:
        validate(path)
    print(f"gems: {len(gem_files)} valid transparent 200x200 assets")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    actual_paths = {
        f"/{path.relative_to(PUBLIC).as_posix()}"
        for path in ASSET_ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in {".png", ".webp"}
    }
    assets = manifest.get("assets", [])
    manifest_paths = {asset["path"] for asset in assets}
    if manifest.get("manifestVersion") != 1 or manifest.get("contentReleaseId") != "foundation-1.0.0":
        raise ValueError("asset manifest: unsupported version or content release")
    ids = [asset.get("id") for asset in assets]
    if len(ids) != len(set(ids)):
        raise ValueError("asset manifest: duplicate asset IDs")
    if len(manifest_paths) != len(assets):
        raise ValueError("asset manifest: duplicate asset paths")
    if manifest_paths != actual_paths:
        raise ValueError(f"asset manifest: path mismatch (missing={actual_paths - manifest_paths}, stale={manifest_paths - actual_paths})")
    for asset in assets:
        validate_manifest_asset(asset)
    kind_counts = {kind: sum(asset["kind"] == kind for asset in assets) for kind in EXPECTED_KIND_COUNTS}
    if kind_counts != EXPECTED_KIND_COUNTS:
        raise ValueError(f"asset manifest: kind counts {kind_counts}, expected {EXPECTED_KIND_COUNTS}")
    total_bytes = sum(asset["bytes"] for asset in assets)
    if total_bytes > 8_000_000:
        raise ValueError(f"asset manifest: runtime payload {total_bytes} bytes exceeds 8 MB budget")
    print(f"manifest: {len(manifest_paths)} IDs, paths, dimensions, sizes and SHA-256 hashes valid ({total_bytes / 1_000_000:.2f} MB)")
    print(f"total: {checked} creatures + {len(zone_files)} zones + {len(gem_files)} Gems + {len(egg_files)} eggs + {len(item_files)} items + {len(effect_files)} effects + {len(incubator_files)} incubator + 1 branding + {len(prestige_files)} prestige assets")


if __name__ == "__main__":
    main()
