# Acceptance evidence

**Recorded:** 2026-09-03

This public-safe record captures reproducible technical evidence only. It contains no wallet
private key, RPC URL, source record, witness, or deployment receipt.

## Toolchain and artifacts

| Item | Value |
| --- | --- |
| Container platform | `linux/arm64` / `aarch64` |
| Node base image | `node:22.23.1-bookworm` (digest pinned in `Dockerfile`) |
| Python | `3.11.2` |
| EZKL | `23.0.5` |
| ONNX | `1.19.1` |
| Model SHA-256 | `abeff1e803da99eddc70b206dc297558505d43a02f91ada564ce612f59ee17ec` |
| Calibrated settings SHA-256 | `bc333e4e877104f8c349875bf38387a628bb99afbfad70b006e938560f4256c9` |

## Prior vertical-slice evidence

The Phase 3 generated [proof-feasibility report](proof-feasibility.md) records setup,
eligible/ineligible proof, and local verification timings. Phase 4 contract tests use those
real locally generated proof bundles and cover valid acceptance, mutation rejection,
ineligible rejection, proof replay, and one acceptance per wallet.

The supported receipt is a local Hardhat transaction on chain ID `31337`. Any optional remote
record must contain only a public transaction hash and contract address, never a credential.

## Release-hardening commands

The following commands are the acceptance sequence and are executed by
`scripts/demo-smoke.sh`:

```bash
docker compose build
docker compose run --rm tools npm run check:env
docker compose run --rm tools npm run prove:setup
docker compose run --rm tools npm run prove:eligible
docker compose run --rm tools npm run verify:local
docker compose run --rm tools npm run lint
docker compose run --rm tools npm run test:prover
docker compose run --rm tools npm run test:contracts
docker compose run --rm tools npm test
docker compose run --rm tools npm run build
docker compose run --rm tools node scripts/check-no-phi.mjs
```

## Remaining risks

The scanner is a regression check, not a de-identification guarantee. The prototype has no
source provenance, identity binding, production key custody, privacy audit, clinical
validation, regulatory approval, or remote-testnet dependency. See the
[threat model](threat-model.md) for the complete boundary statement.
