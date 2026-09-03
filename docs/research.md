# Research context

These sources provide technical and regulatory context. They do not make VitaPod compliant
with any standard and do not authorize use with real health data.

- [EZKL documentation](https://docs.ezkl.xyz/) and
  [EZKL source](https://github.com/zkonduit/ezkl) describe ONNX proof generation and EVM
  verifier generation.
- [45 CFR 164.508](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.508)
  describes HIPAA authorization requirements.
- [45 CFR 164.512(i)](https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-E/section-164.512)
  describes specified research use and disclosure pathways.
- [FDA decentralized clinical trials guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/decentralized-clinical-trials-drugs-biological-products-and-devices-guidance-industry)
  is production context, not a claim about this prototype.
- [TLSNotary](https://github.com/tlsnotary/tlsn) is a possible future provenance research
  direction. It is not integrated and does not make local JSON authentic.

A ZK proof can establish correct execution over a private witness, but it cannot establish the
witness's real-world origin or truth.
