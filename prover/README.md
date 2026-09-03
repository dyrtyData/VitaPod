# VitaPod prover

The proof pipeline runs **inside the VitaPod container** (`docker compose run --rm tools ...`).
Nothing here is meant to run against a host Python.

## Execution context

| Item | Value |
| --- | --- |
| Proving engine | Official `ezkl` CLI binary, release `v23.0.5`, `ezkl-linux-aarch64` (glibc) |
| Architecture | `linux/arm64` (`aarch64`), native on Apple Silicon, no emulation |
| Python | Debian bookworm `python3` (3.11) in `/opt/prover`, packages hash-pinned in `requirements.txt` |
| Graph builder | `onnx` package directly (no PyTorch); see `src/model.py` |
| Pins | `src/ezkl_cli.py` (EZKL version + binary sha256), `Dockerfile` (tarball sha256), `requirements.txt` |
| Evidence | `manifest.json`, written by `check_environment.py` |

`src/ezkl_cli.py` is the only file that shells out to `ezkl`. All other modules work with
Python values and files.

## Commands (from the repository root)

```bash
docker compose run --rm tools npm run check:env      # arch + pinned binary + gen-settings; writes prover/manifest.json
docker compose run --rm tools npm run model:export   # writes prover/artifacts/model.onnx
docker compose run --rm tools npm run prove:setup    # calibrate, compile, setup, and generate the Solidity verifier
docker compose run --rm tools npm run prove:eligible # generate a real eligible proof and sanitized bundle
docker compose run --rm tools npm run verify:local   # reconstruct and locally verify the proof from that bundle
docker compose run --rm tools npm run test:prover    # pytest prover/tests
```

## Artifacts

Everything under `prover/artifacts/` is generated and ignored by Git: the model, settings,
compiled circuit, SRS, keys, normalized private input, witness, raw EZKL proof, encoded
calldata, and sanitized bundles. The private input, witness, and proving key never leave
that ignored directory.

`prove:setup` writes the public generated verifier to
`contracts/contracts/generated/Halo2Verifier.sol` with its ABI and digest manifest. The
proof commands refresh `docs/proof-feasibility.md` from measured in-container timings.

## What the browser does with this

The web app imports `prover/artifacts/eligible-proof.json` as a labelled local artifact.
That bundle contains the proof and one public `0`/`1` output, but no source field, normalized
input, witness, or proving key. The browser does not generate the proof.
