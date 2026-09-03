"""The only module that shells out to the `ezkl` CLI.

Every subcommand name, flag, and output-file convention of the pinned release lives
here so a version bump touches one file. Callers get Python values back; a nonzero
exit raises with the CLI's stderr attached.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

PINNED_EZKL_VERSION = "23.0.5"
# sha256 of the extracted `ezkl` binary from ezkl-linux-aarch64.tar.gz at v23.0.5.
PINNED_EZKL_SHA256 = "ec5527a9112efca22a3bec791383bf91d437d2e6f8ac9184811db3be0cf12acc"
PINNED_EZKL_ARCH = "aarch64"


class EzklError(RuntimeError):
    pass


def binary_path() -> Path:
    found = shutil.which("ezkl")
    if found is None:
        raise EzklError("ezkl binary not found on PATH; run inside the VitaPod container")
    return Path(found)


def binary_sha256() -> str:
    return hashlib.sha256(binary_path().read_bytes()).hexdigest()


def run(*args: str) -> subprocess.CompletedProcess[str]:
    cmd = ["ezkl", *args]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise EzklError(
            f"{' '.join(cmd)} exited {result.returncode}\n{result.stdout}\n{result.stderr}"
        )
    return result


def version() -> str:
    out = run("--version").stdout.strip()
    # `ezkl --version` prints "ezkl 23.0.5"
    return out.split()[-1]


def gen_settings(
    model: Path,
    settings: Path,
    *,
    input_scale: int = 0,
    param_scale: int = 0,
) -> dict[str, Any]:
    """Runs gen-settings with private inputs, fixed params, and public outputs.

    Scale 0 means the integer witness is used verbatim: no fixed-point quantization
    happens inside EZKL, so the circuit compares exactly the integers we hand it.
    """
    run(
        "gen-settings",
        "-M",
        str(model),
        "-O",
        str(settings),
        "-S",
        str(input_scale),
        "--param-scale",
        str(param_scale),
        "--input-visibility",
        "private",
        "--param-visibility",
        "fixed",
        "--output-visibility",
        "public",
    )
    return json.loads(settings.read_text())


def canonical_settings_sha256(settings: dict[str, Any]) -> str:
    """Digest of the settings with run-to-run noise removed.

    gen-settings stamps a `timestamp` and emits `required_range_checks` in hash-map
    order, so the raw file differs between identical runs. Everything that affects
    the circuit is kept; the digest is stable for the same model and flags.
    """
    canonical = {k: v for k, v in settings.items() if k != "timestamp"}
    if "required_range_checks" in canonical:
        canonical["required_range_checks"] = sorted(canonical["required_range_checks"])
    if "required_lookups" in canonical:
        canonical["required_lookups"] = sorted(
            canonical["required_lookups"], key=json.dumps
        )
    encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode()).hexdigest()
