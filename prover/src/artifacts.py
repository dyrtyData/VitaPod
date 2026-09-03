from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
PROVER_DIR = REPOSITORY_ROOT / "prover"
ARTIFACTS_DIR = PROVER_DIR / "artifacts"
FIXTURES_DIR = PROVER_DIR / "fixtures"
MANIFEST_PATH = PROVER_DIR / "manifest.json"

MODEL_PATH = ARTIFACTS_DIR / "model.onnx"
SETTINGS_PATH = ARTIFACTS_DIR / "settings.json"
CALIBRATION_PATH = ARTIFACTS_DIR / "calibration.json"
COMPILED_CIRCUIT_PATH = ARTIFACTS_DIR / "model.compiled"
SRS_PATH = ARTIFACTS_DIR / "kzg.srs"
PROVING_KEY_PATH = ARTIFACTS_DIR / "pk.key"
VERIFICATION_KEY_PATH = ARTIFACTS_DIR / "vk.key"

GENERATED_VERIFIER_DIR = REPOSITORY_ROOT / "contracts" / "contracts" / "generated"
VERIFIER_SOLIDITY_PATH = GENERATED_VERIFIER_DIR / "Halo2Verifier.sol"
VERIFIER_ABI_PATH = GENERATED_VERIFIER_DIR / "Halo2Verifier.abi.json"
VERIFIER_MANIFEST_PATH = GENERATED_VERIFIER_DIR / "MANIFEST.md"
PROOF_FEASIBILITY_PATH = REPOSITORY_ROOT / "docs" / "proof-feasibility.md"


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n")


def read_manifest() -> dict[str, Any]:
    value = read_json(MANIFEST_PATH)
    if not isinstance(value, dict):
        raise ValueError("prover/manifest.json must contain a JSON object")
    return value


def write_manifest(manifest: dict[str, Any]) -> None:
    write_json(MANIFEST_PATH, manifest)
