"""Writes prover/artifacts/model.onnx (byte-deterministic for a given onnx version)."""

from __future__ import annotations

import hashlib
from pathlib import Path

from model import policy_graph_bytes

PROVER_DIR = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = PROVER_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.onnx"


def export_model(path: Path = MODEL_PATH) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = policy_graph_bytes()
    path.write_bytes(data)
    return hashlib.sha256(data).hexdigest()


if __name__ == "__main__":
    digest = export_model()
    print(f"wrote {MODEL_PATH.relative_to(PROVER_DIR.parent)} sha256={digest}")
