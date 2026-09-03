from __future__ import annotations

import argparse
from pathlib import Path

import ezkl_cli
from artifacts import ARTIFACTS_DIR, MODEL_PATH, read_manifest, sha256_file
from bundle import artifact_paths_for_bundle, build_bundle, write_bundle


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a sanitized bundle from an EZKL proof")
    parser.add_argument("--proof", required=True, type=Path, help="raw EZKL proof JSON")
    parser.add_argument("--out", required=True, type=Path, help="sanitized proof bundle path")
    parser.add_argument(
        "--eligible",
        required=True,
        choices=("true", "false"),
        help="expected public eligibility output",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest = read_manifest()
    paths = artifact_paths_for_bundle(args.out, ARTIFACTS_DIR)
    ezkl_cli.encode_evm_calldata(args.proof, paths.calldata)
    bundle = build_bundle(
        args.proof,
        paths.calldata,
        model_sha256=manifest["modelSha256"],
        ezkl_version=manifest["ezklVersion"],
        expected_eligible=args.eligible == "true",
    )
    if MODEL_PATH.is_file() and manifest["modelSha256"] != sha256_file(MODEL_PATH):
        raise SystemExit("model digest differs from prover/manifest.json")
    write_bundle(args.out, bundle)
    print(f"wrote sanitized proof bundle: {args.out}")


if __name__ == "__main__":
    main()
