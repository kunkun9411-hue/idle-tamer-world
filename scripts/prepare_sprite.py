"""Prepare a transparent animation-ready runtime sprite from an alpha master."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--size", type=int, default=200)
    parser.add_argument("--padding", type=int, default=8)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source = Image.open(args.input).convert("RGBA")
    alpha_bbox = source.getchannel("A").getbbox()
    if alpha_bbox is None:
        raise ValueError(f"Sprite has no visible pixels: {args.input}")

    subject = source.crop(alpha_bbox)
    available = args.size - args.padding * 2
    scale = min(available / subject.width, available / subject.height)
    target_size = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    subject = subject.resize(target_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (args.size, args.size), (0, 0, 0, 0))
    position = ((args.size - subject.width) // 2, (args.size - subject.height) // 2)
    canvas.alpha_composite(subject, position)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.output, optimize=True)

    final_alpha = canvas.getchannel("A")
    corners = [
        final_alpha.getpixel((0, 0)),
        final_alpha.getpixel((args.size - 1, 0)),
        final_alpha.getpixel((0, args.size - 1)),
        final_alpha.getpixel((args.size - 1, args.size - 1)),
    ]
    if any(corners):
        raise ValueError(f"Sprite corners are not transparent: {args.output}")

    print(
        {
            "output": str(args.output),
            "size": canvas.size,
            "subject_bbox": final_alpha.getbbox(),
            "alpha_extrema": final_alpha.getextrema(),
        }
    )


if __name__ == "__main__":
    main()
