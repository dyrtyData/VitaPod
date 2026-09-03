#!/usr/bin/env bash
set -euo pipefail

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

forbidden_paths="$(git ls-files | perl -ne 'print if /humanlayer|\.env$|witness|pk\.key|deployments\/.*\.json/i')"
if [[ -n "$forbidden_paths" ]]; then
  printf 'Forbidden tracked paths:\n%s\n' "$forbidden_paths" >&2
  exit 1
fi
