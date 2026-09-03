from __future__ import annotations

from typing import Any

from artifacts import PROOF_FEASIBILITY_PATH, read_manifest


def test_real_eligible_and_ineligible_proofs_verify(real_pipeline: dict[str, Any]):
    bundles = real_pipeline["bundles"]
    verified = real_pipeline["verified"]

    assert bundles["eligible"]["eligible"] is True
    assert bundles["eligible"]["instances"] == ["1"]
    assert bundles["ineligible"]["eligible"] is False
    assert bundles["ineligible"]["instances"] == ["0"]
    assert verified["eligible"] == bundles["eligible"]
    assert verified["ineligible"] == bundles["ineligible"]


def test_two_proofs_of_the_same_fixture_are_distinct(real_pipeline: dict[str, Any]):
    first = real_pipeline["bundles"]["eligible"]
    second = real_pipeline["bundles"]["eligible_second"]

    assert first["instances"] == second["instances"] == ["1"]
    assert first["proof"] != second["proof"]
    assert real_pipeline["verified"]["eligible_second"] == second


def test_pipeline_records_all_required_timings(real_pipeline: dict[str, Any]):
    manifest = read_manifest()
    timings = manifest["timingsSeconds"]

    for name in (
        "setup",
        "proveEligible",
        "verifyEligible",
        "proveIneligible",
        "verifyIneligible",
    ):
        assert timings[name] >= 0

    report = PROOF_FEASIBILITY_PATH.read_text()
    assert "| Setup |" in report
    assert "| Prove (eligible) |" in report
    assert "| Verify (eligible) |" in report
    assert manifest["ezklVersion"] in report
    assert manifest["onnxVersion"] in report
