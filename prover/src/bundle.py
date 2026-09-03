from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from artifacts import read_json, write_json

BUNDLE_FORMAT = "vitapod-proof-bundle.v1"
POLICY_ID = "vitapod-demo-metabolic-v1"
VERIFY_PROOF_SELECTOR = bytes.fromhex("1e8e1e13")
FORBIDDEN_SOURCE_NAMES = (
    "ageYears",
    "hba1cPercent",
    "egfrMlMin1_73m2",
    "input_data",
)
UINT256_MAX = (1 << 256) - 1
HEX_BYTES = re.compile(r"^0x(?:[0-9a-fA-F]{2})+$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
UINT256_DECIMAL = re.compile(r"^(0|[1-9][0-9]*)$")


class BundleError(ValueError):
    pass


@dataclass(frozen=True)
class BundleArtifacts:
    private_input: Path
    witness: Path
    ezkl_proof: Path
    calldata: Path
    verification_proof: Path


def artifact_paths_for_bundle(bundle_path: Path, artifacts_dir: Path) -> BundleArtifacts:
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "-", bundle_path.stem)
    prefix = artifacts_dir / safe_name
    return BundleArtifacts(
        private_input=Path(f"{prefix}.input.json"),
        witness=Path(f"{prefix}.witness.json"),
        ezkl_proof=Path(f"{prefix}.ezkl-proof.json"),
        calldata=Path(f"{prefix}.calldata.bytes"),
        verification_proof=Path(f"{prefix}.verification-proof.json"),
    )


def _word(data: bytes, offset: int) -> int:
    end = offset + 32
    if offset < 0 or end > len(data):
        raise BundleError("encoded verifier calldata is truncated")
    return int.from_bytes(data[offset:end], "big")


def decode_verifier_calldata(calldata: bytes) -> tuple[str, list[str]]:
    if len(calldata) < 4 + 64 or calldata[:4] != VERIFY_PROOF_SELECTOR:
        raise BundleError("encoded calldata is not verifyProof(bytes,uint256[])")

    arguments = calldata[4:]
    proof_offset = _word(arguments, 0)
    instances_offset = _word(arguments, 32)
    if proof_offset % 32 or instances_offset % 32:
        raise BundleError("encoded verifier calldata contains an unaligned offset")

    proof_length = _word(arguments, proof_offset)
    proof_start = proof_offset + 32
    proof_end = proof_start + proof_length
    if proof_end > len(arguments):
        raise BundleError("encoded verifier calldata contains a truncated proof")

    instance_count = _word(arguments, instances_offset)
    instances_start = instances_offset + 32
    instances_end = instances_start + instance_count * 32
    if instances_end > len(arguments):
        raise BundleError("encoded verifier calldata contains truncated instances")

    proof = f"0x{arguments[proof_start:proof_end].hex()}"
    instances = [
        str(_word(arguments, instances_start + index * 32))
        for index in range(instance_count)
    ]
    return proof, instances


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise BundleError(message)


def validate_bundle(value: Any) -> dict[str, Any]:
    _require(isinstance(value, dict), "proof bundle must be a JSON object")
    expected_keys = {
        "format",
        "policyId",
        "modelSha256",
        "ezklVersion",
        "eligible",
        "proof",
        "instances",
    }
    _require(set(value) == expected_keys, "proof bundle has missing or unknown fields")
    _require(value["format"] == BUNDLE_FORMAT, "unsupported proof bundle format")
    _require(value["policyId"] == POLICY_ID, "unsupported policy id")
    _require(isinstance(value["modelSha256"], str), "modelSha256 must be a string")
    _require(SHA256.fullmatch(value["modelSha256"]) is not None, "invalid modelSha256")
    _require(isinstance(value["ezklVersion"], str) and value["ezklVersion"], "invalid EZKL version")
    _require(type(value["eligible"]) is bool, "eligible must be a boolean")
    _require(isinstance(value["proof"], str), "proof must be a hex string")
    _require(HEX_BYTES.fullmatch(value["proof"]) is not None, "invalid proof hex")
    _require(isinstance(value["instances"], list), "instances must be an array")
    _require(len(value["instances"]) == 1, "bundle must have exactly one public instance")

    instance = value["instances"][0]
    _require(isinstance(instance, str), "instance must be a decimal string")
    _require(UINT256_DECIMAL.fullmatch(instance) is not None, "invalid uint256 decimal string")
    public_output = int(instance)
    _require(public_output <= UINT256_MAX, "instance exceeds uint256")
    _require(public_output in (0, 1), "public eligibility output must be 0 or 1")
    _require(value["eligible"] == (public_output == 1), "eligible does not match public output")

    serialized = json.dumps(value, sort_keys=True)
    _require(
        not any(name in serialized for name in FORBIDDEN_SOURCE_NAMES),
        "proof bundle contains a private source field name",
    )
    return value


def build_bundle(
    proof_path: Path,
    calldata_path: Path,
    *,
    model_sha256: str,
    ezkl_version: str,
    expected_eligible: bool,
) -> dict[str, Any]:
    proof, instances = decode_verifier_calldata(calldata_path.read_bytes())
    raw_proof = read_json(proof_path)
    _require(isinstance(raw_proof, dict), "EZKL proof must be a JSON object")
    _require(raw_proof.get("hex_proof") == proof, "calldata proof differs from EZKL proof")
    _require(len(instances) == 1, "EZKL proof must expose one public output")

    bundle = {
        "format": BUNDLE_FORMAT,
        "policyId": POLICY_ID,
        "modelSha256": model_sha256,
        "ezklVersion": ezkl_version,
        "eligible": instances[0] == "1",
        "proof": proof,
        "instances": instances,
    }
    _require(bundle["eligible"] == expected_eligible, "proof output differs from demo policy")
    return validate_bundle(bundle)


def write_bundle(path: Path, value: dict[str, Any]) -> None:
    validate_bundle(value)
    write_json(path, value)


def proof_document_from_bundle(bundle: dict[str, Any]) -> dict[str, Any]:
    validated = validate_bundle(bundle)
    proof_bytes = bytes.fromhex(validated["proof"][2:])
    serialized_instances = [
        int(instance).to_bytes(32, "little").hex() for instance in validated["instances"]
    ]
    return {
        "protocol": None,
        "instances": [serialized_instances],
        "proof": list(proof_bytes),
        "hex_proof": validated["proof"],
        "transcript_type": "EVM",
        "split": None,
        "pretty_public_inputs": None,
        "timestamp": None,
        "version": validated["ezklVersion"],
    }
