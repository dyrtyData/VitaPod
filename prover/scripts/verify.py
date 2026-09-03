from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import verify_proof_bundle


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Locally verify a sanitized VitaPod proof bundle")
    parser.add_argument("--bundle", required=True, type=Path, help="sanitized proof bundle path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    bundle = verify_proof_bundle(args.bundle)
    print(
        json.dumps(
            {
                "status": "verified",
                "bundle": str(args.bundle),
                "eligible": bundle["eligible"],
                "publicOutput": bundle["instances"][0],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
