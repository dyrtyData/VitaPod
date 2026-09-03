from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import prove_fixture


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a sanitized VitaPod EZKL proof bundle")
    parser.add_argument("--input", required=True, type=Path, help="synthetic input fixture")
    parser.add_argument("--out", required=True, type=Path, help="sanitized proof bundle path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    bundle = prove_fixture(args.input, args.out)
    print(
        json.dumps(
            {
                "status": "proved",
                "bundle": str(args.out),
                "eligible": bundle["eligible"],
                "publicOutput": bundle["instances"][0],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
