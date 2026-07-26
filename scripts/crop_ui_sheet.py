"""Crop a generated UI sheet into alpha-preserving master assets."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def main() -> None:
    source = Path(sys.argv[1])
    out = Path(sys.argv[2])
    ids = sys.argv[3:]
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    columns = 4
    rows = (len(ids) + columns - 1) // columns
    x_edges = [round(width * index / columns) for index in range(columns + 1)]
    y_edges = [round(height * index / rows) for index in range(rows + 1)]
    out.mkdir(parents=True, exist_ok=True)
    for index, asset_id in enumerate(ids):
        column, row = index % columns, index // columns
        cell = image.crop((x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1]))
        bounds = cell.getchannel("A").getbbox()
        if bounds is None:
            raise SystemExit(f"{asset_id}: no visible alpha")
        asset = cell.crop(bounds)
        destination = out / f"frame-{asset_id.lower()}-silver-ether-v1-master.png"
        asset.save(destination)
        print(f"{asset_id} {asset.size[0]}x{asset.size[1]} -> {destination}")


if __name__ == "__main__":
    main()
