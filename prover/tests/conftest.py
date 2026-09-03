from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from artifacts import ARTIFACTS_DIR, FIXTURES_DIR
from pipeline import prove_fixture, setup_pipeline, verify_proof_bundle


@pytest.fixture(scope="session")
def real_pipeline() -> dict[str, Any]:
    manifest = setup_pipeline()
    paths = {
        "eligible": ARTIFACTS_DIR / "eligible-proof.json",
        "ineligible": ARTIFACTS_DIR / "ineligible-proof.json",
        "eligible_second": ARTIFACTS_DIR / "eligible-proof.second.json",
    }
    inputs = {
        "eligible": FIXTURES_DIR / "eligible.json",
        "ineligible": FIXTURES_DIR / "ineligible.json",
        "eligible_second": FIXTURES_DIR / "eligible.json",
    }

    bundles = {
        name: prove_fixture(inputs[name], Path(path)) for name, path in paths.items()
    }
    verified = {name: verify_proof_bundle(Path(path)) for name, path in paths.items()}
    return {
        "manifest": manifest,
        "paths": paths,
        "bundles": bundles,
        "verified": verified,
    }
