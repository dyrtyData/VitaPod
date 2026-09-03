# VitaPod

VitaPod is a Docker-first, synthetic-data technical prototype for demonstrating a
zero-knowledge proof of a fixed eligibility computation. It is not a clinical trial,
medical device, enrollment workflow, source-authentication system, or HIPAA-compliant
service. Do not use it with real health records.

The browser validates a synthetic record in memory and previews a published demonstration
policy. A local CLI inside the pinned container generates and verifies the proof. The
registry records only a wallet address, policy digest, and proof digest; it never receives
the source record or raw biomarker values.

## Quickstart

Prerequisite: Docker Desktop must be running. The host does not need Node, Python, or EZKL.

```bash
docker compose build
docker compose run --rm tools npm run prove:setup
docker compose run --rm tools npm run prove:eligible
docker compose run --rm tools npm run verify:local
docker compose up -d chain web
```

Open `http://localhost:5173`, select `prover/fixtures/eligible.json`, then import the
locally generated `prover/artifacts/eligible-proof.json`. For the local wallet receipt and
the three-minute presentation sequence, follow [docs/demo-runbook.md](docs/demo-runbook.md).

## Reproducibility

Run the complete clean-worktree regression sequence with:

```bash
bash scripts/demo-smoke.sh
```

It builds the native `linux/arm64` image, proves and verifies the eligible fixture, runs
lint, tests, contract tests, the production build, and the release scanner. See
[docs/architecture.md](docs/architecture.md) for the data flow and
[docs/proof-feasibility.md](docs/proof-feasibility.md) for pinned versions and measured
proof timings.

## Boundaries

- Synthetic fixtures only. The committed fixtures are fictional and are not from a person,
  laboratory, or provider.
- A proof establishes correct execution of this fixed demonstration policy over a private
  witness. It does not authenticate the witness or bind it to a person.
- Local Hardhat verification is the supported demo path. A remote HashKey deployment is
  optional, fail-closed, and requires human-supplied testnet configuration.

More detail: [demo scope](docs/demo-scope.md), [threat model](docs/threat-model.md), and
[research context](docs/research.md).

## License

MIT. See [LICENSE](LICENSE).
