"""The toolchain spike in executable form; also the first thing CI and judges run.

Asserts the container is native aarch64, the `ezkl` binary is the pinned release
byte-for-byte, exports the policy graph, and proves EZKL accepts it by running
gen-settings. Records the evidence in prover/manifest.json (deterministic content,
so a clean run leaves Git clean).
"""

from __future__ import annotations

import json
import platform
import sys
from pathlib import Path

import onnx

import ezkl_cli
from model import GRAPH_VARIANT

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_model import ARTIFACTS_DIR, MODEL_PATH, export_model  # noqa: E402

PROVER_DIR = Path(__file__).resolve().parents[1]
MANIFEST_PATH = PROVER_DIR / "manifest.json"
SETTINGS_PATH = ARTIFACTS_DIR / "settings.json"


def fail(message: str) -> None:
    raise SystemExit(f"check_environment: {message}")


def main() -> None:
    machine = platform.machine()
    if machine != ezkl_cli.PINNED_EZKL_ARCH:
        fail(f"expected {ezkl_cli.PINNED_EZKL_ARCH}, running on {machine}")

    version = ezkl_cli.version()
    if not version.startswith(ezkl_cli.PINNED_EZKL_VERSION):
        fail(f"expected ezkl {ezkl_cli.PINNED_EZKL_VERSION}, found {version}")

    binary_digest = ezkl_cli.binary_sha256()
    if binary_digest != ezkl_cli.PINNED_EZKL_SHA256:
        fail(f"ezkl binary sha256 {binary_digest} != pinned {ezkl_cli.PINNED_EZKL_SHA256}")

    model_digest = export_model()
    settings = ezkl_cli.gen_settings(MODEL_PATH, SETTINGS_PATH)

    manifest = {
        "arch": machine,
        "ezklVersion": version,
        "ezklSha256": binary_digest,
        "onnxVersion": onnx.__version__,
        "graphVariant": GRAPH_VARIANT,
        "modelSha256": model_digest,
        "settingsSha256": ezkl_cli.canonical_settings_sha256(settings),
        "logrows": settings["run_args"]["logrows"],
        "inputScale": settings["run_args"]["input_scale"],
        "inputVisibility": settings["run_args"]["input_visibility"],
        "outputVisibility": settings["run_args"]["output_visibility"],
        "modelInstanceShapes": settings["model_instance_shapes"],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
