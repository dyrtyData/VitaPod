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
docker compose run --rm tools npm run test:prover    # pytest prover/tests
```

Proof generation (`prove:setup`, `prove:eligible`, `verify:local`) is added by the next phase.

## Artifacts

Everything under `prover/artifacts/` is generated and ignored by Git: `model.onnx`,
`settings.json`, and later the compiled circuit, keys, witness, proof, and sanitized
bundles. The private witness and proving key never leave that ignored directory.

## What the browser does with this

The web app imports the sanitized proof bundle produced here as a labelled local
artifact. It does not prove in the browser.
