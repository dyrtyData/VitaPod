from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest

from artifacts import ARTIFACTS_DIR, FIXTURES_DIR, read_json
from bundle import (
    FORBIDDEN_SOURCE_NAMES,
    BundleError,
    artifact_paths_for_bundle,
    decode_verifier_calldata,
    proof_document_from_bundle,
    validate_bundle,
)
from normalization import parse_record_text


def test_bundles_omit_source_names_and_values(real_pipeline: dict[str, Any]):
    for name in ("eligible", "ineligible", "eligible_second"):
        bundle = real_pipeline["bundles"][name]
        serialized = json.dumps(bundle, sort_keys=True)
        assert not any(field in serialized for field in FORBIDDEN_SOURCE_NAMES)
        assert "vitapod.synthetic-lab.v1" not in serialized

    for outcome in ("eligible", "ineligible"):
        fixture = parse_record_text((FIXTURES_DIR / f"{outcome}.json").read_text())
        source_values = {
            str(value)
            for value in fixture.values()
            if isinstance(value, (int, Decimal)) and not isinstance(value, bool)
        }
        bundle_strings = {
            value
            for value in real_pipeline["bundles"][outcome].values()
            if isinstance(value, str)
        }
        bundle_strings.update(real_pipeline["bundles"][outcome]["instances"])
        assert source_values.isdisjoint(bundle_strings)


def test_bundle_matches_official_ezkl_calldata_encoding(real_pipeline: dict[str, Any]):
    for name, bundle_path in real_pipeline["paths"].items():
        paths = artifact_paths_for_bundle(bundle_path, ARTIFACTS_DIR)
        proof, instances = decode_verifier_calldata(paths.calldata.read_bytes())
        bundle = real_pipeline["bundles"][name]
        assert proof == bundle["proof"]
        assert instances == bundle["instances"]


def test_bundle_round_trips_to_an_ezkl_verification_document(real_pipeline: dict[str, Any]):
    bundle = validate_bundle(read_json(real_pipeline["paths"]["eligible"]))
    proof_document = proof_document_from_bundle(bundle)

    assert proof_document["hex_proof"] == bundle["proof"]
    assert proof_document["proof"] == list(bytes.fromhex(bundle["proof"][2:]))
    assert proof_document["instances"] == [["01" + "00" * 31]]


@pytest.mark.parametrize(
    "mutation",
    [
        {"format": "vitapod-proof-bundle.v2"},
        {"eligible": False},
        {"instances": ["2"]},
        {"proof": "not-hex"},
        {"ageYears": 45},
    ],
)
def test_python_bundle_contract_rejects_invalid_values(mutation: dict[str, Any]):
    valid = {
        "format": "vitapod-proof-bundle.v1",
        "policyId": "vitapod-demo-metabolic-v1",
        "modelSha256": "a" * 64,
        "ezklVersion": "23.0.5",
        "eligible": True,
        "proof": "0x0102",
        "instances": ["1"],
    }
    valid.update(mutation)
    with pytest.raises(BundleError):
        validate_bundle(valid)


def test_calldata_decoder_rejects_the_wrong_selector():
    with pytest.raises(BundleError, match="verifyProof"):
        decode_verifier_calldata(bytes(68))


def test_bundle_names_with_extra_suffixes_keep_distinct_private_artifacts():
    first = artifact_paths_for_bundle(Path("eligible-proof.json"), ARTIFACTS_DIR)
    second = artifact_paths_for_bundle(Path("eligible-proof.second.json"), ARTIFACTS_DIR)
    assert first.ezkl_proof != second.ezkl_proof
    assert first.calldata != second.calldata
