# Three-minute demo runbook

## Prepare

1. Start Docker Desktop and run `docker compose build` from the VitaPod repository.
2. Run `docker compose run --rm tools npm run prove:setup`, then `npm run prove:eligible`
   and `npm run verify:local` through the same `tools` service.
3. Run `docker compose up -d chain web`, then
   `docker compose run --rm tools npm run chain:deploy:local`.
4. Open `http://localhost:5173`. Keep `prover/fixtures/eligible.json` and the generated
   `prover/artifacts/eligible-proof.json` ready to import.

## Presentation

- **0:00** - Select the synthetic fixture. It stays in browser memory; VitaPod is not a
  medical or enrollment decision.
- **0:30** - Show the local preview of the fixed demonstration policy, not a trained model.
- **1:00** - Import the CLI-generated, locally verified bundle. Show its public result and
  digest, not the selected source values.
- **1:30** - Connect the local test wallet and submit. The registry receives verifier
  arguments and emits only the wallet, policy digest, and proof digest.
- **2:15** - Show the receipt and run `docker compose run --rm tools npm run chain:state:local`.
- **2:45** - State the limits: no lab provenance, identity binding, enrollment, real records,
  or compliance claim.

## Local wallet receipt

1. Use a new empty demo wallet; do not use a wallet with real assets.
2. Add `VitaPod local`: RPC `http://localhost:8545`, chain ID `31337`, symbol `ETH`.
3. Import only a public throwaway Hardhat account printed by the local node. Never share a
   seed phrase or private key in chat or Git.
4. Import the eligible bundle, connect, then submit and approve the test transaction.
5. Confirm the receipt contains only an address and two digests.

## Contingencies

- **Local Hardhat is the primary path for the live, timed demo — this is a deliberate choice, not a fallback.** The registry and verifier are also deployed and source-verified on HashKey Chain Testnet (chain 133; see `README.md` → Live Deployment), but the live click-through should run against localhost. A public RPC call has failure modes a local Hardhat node doesn't (latency, rate limiting, brief downtime) that you cannot control or predict during a strict 3-minute clock. Mention or show the testnet explorer as corroborating evidence — after the timed showcase, or as an aside — rather than depending on it for the click-through itself.
- A rehearsal consumes a proof and wallet acceptance by design. Restart the local chain and
  redeploy, or generate a fresh proof and use an unused local account.
- The optional remote deployment already exists (see Live Deployment in `README.md`); if you
  do want to demo against it directly, human-supplied values live only in ignored
  `contracts/.env` — run `checkNetwork.ts` first and do not request or record credentials.

After the runbook, a novice should be able to say that the proof establishes correct execution
of a fixed computation over a private synthetic input, not lab provenance, enrollment, or
HIPAA compliance.
