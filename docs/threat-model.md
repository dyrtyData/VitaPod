# Threat model

VitaPod is a demonstration of proof-of-computation over a synthetic private witness. This
document describes its boundaries, not production assurances.

| Topic | What VitaPod provides | What remains out of scope |
| --- | --- | --- |
| Witness confidentiality | The source record, normalized input, witness, and proving key are omitted from the sanitized bundle and ignored by Git. | A proof system does not erase all metadata risks, and this prototype is not independently audited. |
| Proof integrity | EZKL produces a proof checked locally and by the generated EVM verifier. Contract tests use real generated bundles. | This does not prove the source data is true or clinically meaningful. |
| Provenance | Explicitly none. | VitaPod cannot show a record came from a lab, provider, or any particular person. |
| Replay | The registry tracks a proof digest and allows one acceptance per wallet. | A wallet is not a human identity, and the controls are demo-grade rather than an identity system. |
| Wallet identity | The submitting address is recorded as public metadata. | No accounts, identity verification, key custody, recovery, or revocation is provided. |
| Metadata leakage | Events emit only submitter, policy digest, and proof digest; instances are not stored or emitted. | Chain activity, addresses, timing, and digests are public. Do not deploy if a verifier design requires revealing sensitive public inputs. |
| Regulatory scope | The UI and docs state the synthetic-only, non-enrollment boundary. | No HIPAA, FDA, clinical-trial, consent, or sponsor compliance claim is made. |

`scripts/check-no-phi.mjs` is a regression net that checks tracked paths, known eligible-fixture
record content, secret-like assignments, and the production web build. It is not a
de-identification guarantee and must not be treated as evidence that real health data is safe
