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
    {
        "id": "A06",
        "family": "frame",
        "name": "Kompakte Kartenrahmenecke",
        "source": "frame-corner-compact-silver-ether-v1-master.png",
        "output": "frame/corner-compact-v1.webp",
        "target": (256, 256),
        "padding": 6,
        "rotatable": True,
        "connections": ["right", "bottom"],
        "status": "approved",
    },
    {
        "id": "A07",
        "family": "frame",
        "name": "Minimale Tooltip-Rahmenecke",
        "source": "frame-corner-tooltip-silver-ether-v1-master.png",
        "output": "frame/corner-tooltip-v1.webp",
        "target": (192, 192),
        "padding": 6,
        "rotatable": True,
        "connections": ["right", "bottom"],
        "status": "approved",
    },
]

# The first generated production batch extends the original frame proof into a
# real reusable kit.  These entries intentionally stay data-driven so the
# manifest, runtime dimensions, checksums and catalog can be regenerated from
# the same source of truth.
ITEMS.extend([
    {
        "id": "A08", "family": "frame", "name": "Gerader horizontaler Verbinder",
        "source": "frame-a08-silver-ether-v1-master.png", "output": "frame/connector-horizontal-v1.webp",
        "target": (1024, 192), "padding": 8, "rotatable": True,
        "connections": ["left", "right"], "status": "approved",
    },
    {
        "id": "A09", "family": "frame", "name": "Gerader vertikaler Verbinder",
        "source": "frame-a08-silver-ether-v1-master.png", "output": "frame/connector-vertical-v1.webp",
        "target": (192, 1024), "padding": 8, "rotation": 90, "rotatable": True,
        "connections": ["top", "bottom"], "status": "approved", "derivation": "rotate-90-from-A08",
    },
    {
        "id": "A10", "family": "frame", "name": "Verzierter horizontaler Verbinder",
        "source": "frame-a10-silver-ether-v1-master.png", "output": "frame/connector-ornate-horizontal-v1.webp",
        "target": (1024, 192), "padding": 8, "rotatable": True,
        "connections": ["left", "right"], "status": "approved",
    },
    {
        "id": "A11", "family": "frame", "name": "Verzierter vertikaler Verbinder",
        "source": "frame-a10-silver-ether-v1-master.png", "output": "frame/connector-ornate-vertical-v1.webp",
        "target": (192, 1024), "padding": 8, "rotation": 90, "rotatable": True,
        "connections": ["top", "bottom"], "status": "approved", "derivation": "rotate-90-from-A10",
    },
    {
        "id": "A12", "family": "frame", "name": "Horizontale Endkappe",
        "source": "frame-a12-silver-ether-v1-master.png", "output": "frame/endcap-horizontal-v1.webp",
        "target": (256, 192), "padding": 8, "rotatable": True,
        "connections": ["left"], "status": "approved",
    },
    {
        "id": "A13", "family": "frame", "name": "Vertikale Endkappe",
        "source": "frame-a12-silver-ether-v1-master.png", "output": "frame/endcap-vertical-v1.webp",
        "target": (192, 256), "padding": 8, "rotation": 90, "rotatable": True,
        "connections": ["top"], "status": "approved", "derivation": "rotate-90-from-A12",
    },
    {
        "id": "A14", "family": "frame", "name": "T-Verbindung für verschachtelte Flächen",
        "source": "frame-a14-silver-ether-v1-master.png", "output": "frame/junction-t-v1.webp",
        "target": (256, 256), "padding": 8, "rotatable": True,
        "connections": ["top", "right", "bottom"], "status": "approved",
    },
    {
        "id": "A15", "family": "frame", "name": "Fokus-Eckaufsatz",
        "source": "frame-a15-silver-ether-v1-master.png", "output": "frame/cap-focus-v1.webp",
        "target": (256, 256), "padding": 8, "rotatable": True,
        "connections": ["right", "bottom"], "status": "approved",
    },
    {
        "id": "A16", "family": "frame", "name": "Warnungs-Eckaufsatz",
        "source": "frame-a16-silver-ether-v1-master.png", "output": "frame/cap-warning-v1.webp",
        "target": (256, 256), "padding": 8, "rotatable": True,
        "connections": ["right", "bottom"], "status": "approved",
    },
    {
        "id": "A17", "family": "frame", "name": "Kompakter Ether-Trenner",
        "source": "frame-a17-silver-ether-v1-master.png", "output": "frame/divider-compact-v1.webp",
        "target": (1024, 128), "padding": 8, "rotatable": True,
        "connections": ["left", "right"], "status": "approved",
    },
    {
        "id": "A18", "family": "frame", "name": "Kleine Ether-Niete",
        "source": "frame-a18-silver-ether-v1-master.png", "output": "frame/rivet-small-v1.webp",
        "target": (128, 128), "padding": 8, "rotatable": True,
        "connections": [], "status": "approved",
    },
])

_ECONOMY_NAMES = {
    "F01": "Silber-Ether-Münze", "F02": "Ether-Premiumkristall", "F03": "Monsterfragment",
    "F04": "Forschungsmaterial", "F05": "Gilden-DNA", "F06": "Starter-Ei",
    "F07": "Dreieck-Gem", "F08": "Quadrat-Gem", "F09": "Raute-Gem",
    "F10": "Hyperlevel-Fragment", "F11": "Evolutionskern", "F12": "Expeditionsmarke",
    "F13": "Gilden-Essenz", "F14": "Kampfmaterial", "F15": "Offline-Speicher",
    "F16": "Freischaltkristall",
}
for _id, _name in _ECONOMY_NAMES.items():
    ITEMS.append({
        "id": _id, "family": "economy", "name": _name,
        "source": f"economy-icon-{_id.lower()}-silver-ether-v1-master.png",
        "output": f"economy/{_id.lower()}-v1.webp", "target": (256, 256), "padding": 8,
        "rotatable": False, "connections": [], "quality": 45, "status": "approved",
    })

_SYSTEM_NAMES = {
    "G01": "Start und Kampf", "G02": "Weltkarte", "G03": "Monster-Habitat", "G04": "Brutstation",
    "G05": "Inventar", "G06": "Forschung", "G07": "Expedition", "G08": "Auftrag und Quest",
    "G09": "Prestige", "G10": "Gilde", "G11": "Gilden-DNA", "G12": "Freunde", "G13": "Chat", "G14": "Rangliste",
    "G15": "Profil", "G16": "Post", "G17": "Einstellungen", "G18": "Audio an", "G20": "Hilfe", "G21": "Information", "G22": "Warnung", "G23": "Erfolg und Haken", "G24": "Fehler", "G25": "Schließen", "G26": "Zurück", "G28": "Hinzufügen", "G29": "Entfernen", "G30": "Sperre", "G31": "Filter", "G32": "Sortieren", "G33": "Suche", "G34": "Aktualisieren", "G35": "Menü", "G36": "Mehr und Optionen",
}
for _id, _name in _SYSTEM_NAMES.items():
    ITEMS.append({
        "id": _id, "family": "system", "name": _name,
        "source": f"system-icon-{_id.lower()}-silver-ether-v1-master.png",
        "output": f"system/{_id.lower()}-v1.webp", "target": (256, 256), "padding": 8,
        "rotatable": False, "connections": [], "quality": 45, "status": "approved",
    })

_SURFACE_NAMES = {
    "B01": ("Ruhige Fensterfläche", (768, 384)),
    "B02": ("Erhöhte Kartenfläche", (768, 384)),
    "B03": ("Kompakte Kartenfläche", (768, 256)),
    "B04": ("Tooltipfläche", (768, 256)),
    "B05": ("Eingabefläche", (768, 192)),
    "B06": ("Dropdownfläche", (768, 192)),
    "B07": ("Gesperrte Flächenauflage", (768, 384)),
    "B08": ("Hover-Lichtauflage", (768, 384)),
    "B09": ("Fokus-Lichtauflage", (768, 384)),
    "B10": ("Auswahl-Lichtauflage", (768, 384)),
    "B11": ("Fehler-Lichtauflage", (768, 384)),
    "B12": ("Erfolg-Lichtauflage", (768, 384)),
    "B13": ("Subtile Glasrauschtextur", (512, 512)),
    "B14": ("Tiefe Graphittextur", (512, 512)),
}
for _id, (_name, _target) in _SURFACE_NAMES.items():
    ITEMS.append({
        "id": _id, "family": "surface", "name": _name,
        "source": f"surface-{_id.lower()}-silver-ether-v1-master.png",
        "output": f"surface/{_id.lower()}-v1.webp", "target": _target, "padding": 8,
        "quality": 35, "rotatable": False, "connections": [], "status": "approved",
    })

_CHROME_NAMES = {
    "C01": ("Große Kopfleistenschale", "chrome", (768, 192)),
    "C02": ("Kompakte Kopfleistenschale", "chrome", (768, 128)),
    "C03": ("Fußleistenschale", "chrome", (768, 128)),
    "C04": ("Dünner Ether-Trenner", "chrome", (768, 64)),
    "C05": ("Dicker Ether-Trenner", "chrome", (768, 96)),
    "C06": ("Kurzer symmetrischer Trenner", "chrome", (512, 96)),
    "C07": ("Aktiver Tab-Unterstrich", "chrome", (512, 64)),
    "C08": ("Aktiver Seitenmarker", "chrome", (128, 256)),
    "C09": ("Zentraler Fokusdiamant", "chrome", (128, 128)),
    "C10": ("Kleine Eckniete", "chrome", (64, 64)),
    "C11": ("Kleine Ether-Kristallfassung", "chrome", (128, 128)),
    "C12": ("Große Ether-Kristallfassung", "chrome", (192, 192)),
    "C13": ("Passive Etherlinie", "chrome", (512, 32)),
    "C14": ("Aktive Etherlinie", "chrome", (512, 48)),
    "C15": ("Warnungsleiste", "chrome", (768, 96)),
    "C16": ("Erfolgsleiste", "chrome", (768, 96)),
    "D01": ("Primärer Buttonrahmen", "control", (512, 128)),
    "D02": ("Sekundärer Buttonrahmen", "control", (512, 128)),
    "D03": ("Ghost-Buttonrahmen", "control", (512, 128)),
    "D04": ("Kompakter Buttonrahmen", "control", (384, 112)),
    "D05": ("Gefahren-Buttonrahmen", "control", (512, 128)),
    "D06": ("Runde Icon-Buttonfassung", "control", (128, 128)),
    "D07": ("Eckige Icon-Buttonfassung", "control", (128, 128)),
    "D08": ("Tabrahmen Standard", "control", (384, 96)),
    "D09": ("Tabrahmen aktiv", "control", (384, 96)),
    "D10": ("Äußerer Segmentsteuerungsrahmen", "control", (512, 112)),
    "D11": ("Toggle-Schiene", "control", (192, 80)),
    "D12": ("Toggle-Knopf", "control", (64, 64)),
    "D13": ("Slider-Schiene", "control", (512, 64)),
    "D14": ("Slider-Griff", "control", (72, 72)),
    "D15": ("Checkboxfassung", "control", (64, 64)),
    "D16": ("Radiobuttonfassung", "control", (64, 64)),
    "E01": ("Ressourcen-Chiprahmen", "info", (384, 96)),
    "E02": ("Wertplakette", "info", (384, 96)),
    "E03": ("Kostenplakette", "info", (384, 96)),
    "E04": ("Horizontale Fortschrittsfassung", "info", (768, 64)),
    "E05": ("Statusbadge neutral", "info", (256, 64)),
    "E09": ("Große horizontale Fortschrittsfassung", "info", (768, 64)),
    "E10": ("Kompakte Fortschrittsfassung", "info", (384, 48)),
    "E11": ("Runde Fortschrittsfassung", "info", (128, 128)),
    "E14": ("Tooltip-Pfeil oben", "info", (96, 64)),
    "E18": ("Benachrichtigungspunkt", "info", (64, 64)),
}
for _id, (_name, _family, _target) in _CHROME_NAMES.items():
    ITEMS.append({
        "id": _id, "family": _family, "name": _name,
        "source": f"{_family}-{_id.lower()}-silver-ether-v1-master.png",
        "output": f"{_family}/{_id.lower()}-v1.webp", "target": _target, "padding": 6,
        "quality": 35, "rotatable": False, "connections": [], "status": "approved",
    })

_IDENTITY_NAMES = {
    "H01": "Neutraler runder Avatarrahmen", "H02": "Gewöhnlicher Avatarrahmen",
    "H03": "Seltener Avatarrahmen", "H04": "Epischer Avatarrahmen",
    "H05": "Gildenleiter-Aufsatz", "H06": "Offiziers-Aufsatz",
    "H07": "Online-Statusfassung", "H08": "Rollenplakette Angriff", "H09": "Rollenplakette Verteidigung", "H10": "Rollenplakette Support", "H11": "Rangfassung klein", "H12": "Rangfassung groß",
}
for _id, _name in _IDENTITY_NAMES.items():
    ITEMS.append({
        "id": _id, "family": "identity", "name": _name,
        "source": f"identity-{_id.lower()}-silver-ether-v1-master.png",
        "output": f"identity/{_id.lower()}-v1.webp", "target": (192, 192), "padding": 6,
        "quality": 25, "rotatable": False, "connections": [], "status": "approved",
    })


def fit_alpha(source: Path, destination: Path, target: tuple[int, int], padding: int, rotation: int = 0, quality: int = 75) -> None:
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
        # UI chrome is viewed at small sizes; quality 75 keeps beveled alpha
        # edges crisp while staying below the runtime payload budget.
        canvas.save(destination, "WEBP", quality=quality, method=6, exact=True)


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
        fit_alpha(source, destination, tuple(item["target"]), int(item["padding"]), int(item.get("rotation", 0)), int(item.get("quality", 75)))
        entries.append(runtime_entry(item, destination))
        print(f"{item['id']} {source.name} -> {destination.relative_to(ROOT)}")

    payload = {"kitVersion": 1, "style": "silver-ether", "elements": entries}
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"UI kit manifest: {len(entries)} elements -> {MANIFEST_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
