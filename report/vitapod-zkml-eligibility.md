---
title: "VitaPod — Privacy-Preserving Clinical Trial Eligibility via Zero-Knowledge Machine Learning"
author: "Diana Chang, Mehdi-Loup Nasom, and Mariana Uchoa"
affiliation: "Independent"
venue: "EAG Global Buildathon 2026"
track: "Local AI, Private AI & User-Owned Data"
---

# VitaPod — Privacy-Preserving Clinical Trial Eligibility via Zero-Knowledge Machine Learning

**Diana Chang**^1^, **Mehdi-Loup Nasom**^2^, and **Mariana Uchoa**^3^

^1^PharmD, MS Health IT — AI Engineer  
^2^ENSC Ingénieur en Cognitique — Blockchain/Web3 Developer  
^3^PhD Neuroscience (USC) — Translational Immunology

**Track:** Local AI, Private AI & User-Owned Data  
*Research conducted at the EAG Global Buildathon, September 2026.*

## Abstract

Clinical trial recruitment faces a fundamental tension: patients are willing to contribute health data for research (77% in a 65-study meta-analysis), but willingness drops to 38–52% when pharmaceutical companies are the recipient. This "willingness gap" contributes to enrollment failures — roughly 40% of NCI network trials fail to complete accrual. We present **VitaPod**, a local-first data pod demonstrating that a patient can cryptographically prove they meet a trial's objective pre-screening criteria **without revealing the underlying biomarker values**. VitaPod compiles an ONNX eligibility policy to a Halo2 zk-SNARK via EZKL, verifies proofs on-chain through a generated Solidity verifier, and records only wallet addresses and cryptographic digests in a replay-protected registry. Against a synthetic metabolic trial policy (age, HbA1c, eGFR thresholds), the pipeline achieves **2.05-second proof generation** and **27-millisecond on-chain verification**, with the source record, normalized inputs, and witness remaining entirely local. VitaPod is a synthetic-data technical prototype — it does not authenticate data provenance or establish regulatory compliance — but it demonstrates that the cryptographic primitive for privacy-preserving eligibility verification is practical today.

## 1. Introduction

Patients are willing to contribute their health data to medical research — but not unconditionally. A 2025 meta-analysis of 65 studies across 34 countries found **77% average willingness** to share health data for research purposes, with privacy, consent, and transparency named as decisive conditions [1]. A 2024 systematic review of 116 studies (228,501 participants) revealed a stark gradient by recipient: over 95% would share with their treating physician, 80–92% with academic researchers, but only **38–52% with pharmaceutical companies** [2].

The CISCRP 2023 Perceptions & Insights Study (n=12,017) quantifies the trust deficit: only **18% trust pharmaceutical companies "a lot"**, while **65% believe pharma only wants to make money** [16]. Among actual trial participants, **31% are concerned about their data being stolen**, and **37% worry that data sharing might discourage others from enrolling** [2a].

This "willingness gap" has concrete consequences. Roughly **40% of NCI National Clinical Trials Network trials fail to complete accrual**, and fewer than **2% of adult cancer patients** enroll in any trial [3]. Screen failure rates vary dramatically by indication — from 20–30% for genitourinary cancers to **58–80% for Alzheimer's trials** — with each failed screen costing **$800–$2,500** [4]. Advarra notes that *"up to four out of every five individuals screened may never enroll"* [17]. Clinical research coordinators are underwater: *"The truth is, we must miss some. Our memory is not extensible,"* observed one oncologist in a 2024 qualitative study [5].

The distrust is well-founded. Recent clinical trial data breaches underscore the risk: **Novo Nordisk** (June 2026) exposed biomarkers, health data, and lifestyle factors for approximately 11,500 trial participants [18]. **DM Clinical Research** (2024) left 1.67 million recruitment records — names, medications, pregnancy status — on an unprotected database [18]. **Cencora** (2024) exposed 1.4 million individuals' diagnoses and medications from trials sponsored by Novartis, Bayer, AbbVie, and Regeneron [19]. Unlike credit card theft, health data breaches are permanent — there is no way to "reset" a genome or diagnosis history. Life, disability, and long-term care insurers are not covered by GINA and can legally use such data in underwriting [20].

The Decentralized Science (DeSci) movement is building alternatives to traditional drug development: IP-NFTs for fractional ownership of intellectual property, DAOs for community governance, and micro-grants for rapid funding [6]. But DeSci is missing a critical **privacy layer** — how can patients contribute their data to decentralized trials without handing over their biomarkers?

**Our contribution.** We present VitaPod, a local-first data pod demonstrating that a patient can prove they meet a published eligibility policy without revealing the underlying values. VitaPod:

1. **Compiles an ONNX eligibility policy to a Halo2 zk-SNARK** via EZKL [7], achieving 2.05-second proof generation for a 4-biomarker threshold policy.
2. **Verifies proofs on-chain** through a Solidity verifier generated by EZKL, with 27-millisecond verification and replay protection.
3. **Keeps all health data local** — the browser previews eligibility without network calls; the proof bundle contains only the result bit and reproducibility metadata.
4. **Provides a reproducible, Docker-first demonstration** that reviewers can rebuild from committed artifacts.

VitaPod is a synthetic-data technical prototype. It does not authenticate that data came from a laboratory or EHR, bind a wallet to a unique person, obtain informed consent, or establish regulatory compliance. The proof establishes correct execution over a private witness — not the witness's real-world authenticity. These limitations are explicit scope boundaries, not oversights.

## 2. Related Work

### 2.1 Zero-Knowledge Proofs in Healthcare

The application of zero-knowledge proofs to healthcare privacy has received increasing academic attention since 2024. **TeleZK-L2** proposes a scalable zk-SNARK framework for privacy-preserving telehealth [8]. **TeleZK-FL** extends this to federated learning with quantized zero-knowledge proofs for remote patient monitoring [9]. **zkFL-Health** combines blockchain with zero-knowledge federated learning for medical AI privacy [10]. **CoSMeTIC** (arXiv, January 2026) presents zero-knowledge computational sparse Merkle trees with inclusion-exclusion proofs demonstrated on Huntington's disease and HIV-1 case studies [11].

Commercially, **Solve.Care's Care.Trials** (launched August 2023) claims to be "the first healthcare network to use ZKPs" for anonymous patient-to-trial matching [12]. However, its publicly documented ZK usage focuses on identity verification rather than zkML proving a computation ran correctly over biomarker data.

### 2.2 zkML and EZKL

Zero-knowledge machine learning (zkML) enables proving that a machine learning model was evaluated correctly on private inputs without revealing those inputs. **EZKL** [7] is the leading open-source toolkit for compiling ONNX models to Halo2 zk-SNARK circuits. EZKL has demonstrated proofs over 18-million-parameter neural networks, though its documentation and examples focus on general-purpose applications (MNIST, etc.) rather than clinical eligibility.

### 2.3 Clinical Trial Recruitment and Privacy

The clinical trial recruitment market is valued at **$11.8 billion** (2025), projected to reach **$26.2 billion by 2035** [13]. The AI-based patient-matching segment specifically is growing from **$641.6 million to $1.9 billion by 2030** at 25% CAGR [14].

Privacy-preserving approaches are gaining traction. **Datavant's tokenization** is deployed across 270+ clinical trials, 2,000+ hospitals, and the top 30 pharmaceutical brands [15]. However, tokenization requires a trusted intermediary to hold the linkage keys. A zero-knowledge proof eliminates this requirement — the patient proves eligibility locally, and no party ever holds the source values.

### 2.4 DeSci and IP-NFTs

The Decentralized Science ecosystem, pioneered by **Molecule** and **VitaDAO**, has introduced IP-NFTs (Intellectual Property Non-Fungible Tokens) as a mechanism for fractional ownership of research IP [6]. VitaDAO has reportedly raised over $10 million for longevity research funding through this mechanism. The missing component is a privacy-preserving way to **prove contribution** occurred — the verifiable substrate that VitaPod's architecture could provide.

## 3. Methods

### 3.1 System Architecture

VitaPod follows a three-stage architecture with strict data isolation:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Patient's      │     │  Local Proof    │     │  Blockchain     │
│  Browser        │     │  Pipeline       │     │  Registry       │
│                 │     │                 │     │                 │
│  Health record  │────▶│  EZKL zk-SNARK  │────▶│  ProofAccepted  │
│  stays local    │     │  (no biomarkers │     │  (wallet +      │
│                 │     │   in output)    │     │   digests only) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Stage 1: Browser (Local Only).** The React frontend loads a JSON health record, validates it against a Zod schema, and evaluates eligibility locally using the same policy logic encoded in the ONNX graph. No network requests are made; no browser persistence is used. The record remains in React memory.

**Stage 2: Container (Local Proof Generation).** Inside a pinned Docker container (linux/arm64), Python scripts normalize the record to integer inputs, run EZKL's proving pipeline, and produce a sanitized proof bundle. The bundle contains the Halo2 proof, one public eligibility bit, and reproducibility metadata. It explicitly omits the source record, normalized inputs, the witness, and the proving key.

**Stage 3: Blockchain (Verification and Registry).** The proof is submitted to a `TrialProofRegistry` smart contract, which calls an EZKL-generated `Halo2Verifier` contract. On successful verification, the registry emits a `ProofAccepted(submitter, policyDigest, proofDigest)` event and records the wallet to prevent replay. The registry never receives or stores biomarker values.

### 3.2 Policy Representation

The eligibility policy is represented as an ONNX computational graph with a `comparisons-and` topology:

- **Age ≥ 18** (adult)
- **5.7 ≤ HbA1c < 8.5** (prediabetic to moderately controlled diabetes)
- **eGFR ≥ 60** (adequate kidney function)

All inputs are normalized to integers (age in years, HbA1c × 10, eGFR as-is) for deterministic fixed-point arithmetic in the circuit. The policy is intentionally simple — a threshold check over 4 biomarkers — to demonstrate the architecture. The same EZKL pipeline supports swapping in complex ML models without architectural changes.

### 3.3 Proof Pipeline

The proof pipeline uses the following pinned toolchain:

| Component | Version |
|-----------|---------|
| EZKL | 23.0.5 |
| ONNX | 1.19.1 |
| Python | 3.11.2 |
| Architecture | aarch64 (native arm64) |

The pipeline stages are:

1. **Setup** (one-time): Export ONNX model, calibrate with boundary fixtures, compile circuit, retrieve SRS (Structured Reference String), generate proving/verification keys, generate Solidity verifier.
2. **Prove**: Load normalized inputs, generate witness, produce Halo2 proof, bundle with metadata.
3. **Verify (local)**: EZKL verifies proof against verification key.
4. **Verify (on-chain)**: Solidity verifier checks proof; registry records acceptance.

### 3.4 Smart Contracts

Two contracts handle on-chain verification:

**Halo2Verifier.sol** — Generated by EZKL from the circuit. Exposes a `verifyProof(bytes calldata proof, uint256[] calldata instances)` function that returns true if the proof is valid for the given public instances.

**TrialProofRegistry.sol** — Wraps the verifier with:
- Policy digest check (ensures proof is for the expected policy)
- Replay protection (each wallet can submit only once per policy)
- Event emission (`ProofAccepted` with wallet, policyDigest, proofDigest)

### 3.5 Reproducibility

All components run inside a single Docker image with pinned dependencies. The complete regression sequence is:

```bash
bash scripts/demo-smoke.sh
```

This builds the native image, proves and verifies both eligible and ineligible fixtures, runs lint, tests, contract tests, the production build, and the release scanner. Deterministic outputs are committed for verification.

## 4. Results

### 4.1 Proof Performance

Measured on native linux/arm64 inside the pinned container:

| Operation | Duration |
|-----------|----------|
| Setup (one-time) | 5.665 seconds |
| Prove (eligible) | 2.050 seconds |
| Verify (local) | 0.027 seconds |
| Prove (ineligible) | 1.907 seconds |

Setup includes model export, calibration, circuit compilation, SRS retrieval, key generation, and Solidity verifier generation. SRS retrieval uses a cached artifact on subsequent runs. Prove times measure only the EZKL proof command; witness preparation is excluded.

### 4.2 Privacy Preservation

The proof bundle contains:

| Included | Excluded |
|----------|----------|
| Halo2 proof bytes | Source JSON record |
| Eligibility result (1 bit: 0 or 1) | Normalized integer inputs |
| EZKL version | Witness |
| Model hash | Proving key |
| Settings hash | Any biomarker values |

The `ProofAccepted` event emits:
- `submitter`: wallet address (0x...)
- `policyDigest`: keccak256 hash of policy identifier
- `proofDigest`: keccak256 hash of proof bytes

No age, HbA1c, or eGFR value appears in the proof, calldata, event logs, or registry storage.

### 4.3 Replay Protection

The registry enforces one acceptance per wallet per policy:

```solidity
mapping(bytes32 => mapping(address => bool)) public accepted;

function submit(...) external {
    require(!accepted[policyDigest][msg.sender], "Wallet already accepted");
    // ... verify proof ...
    accepted[policyDigest][msg.sender] = true;
    emit ProofAccepted(msg.sender, policyDigest, proofDigest);
}
```

A second submission from the same wallet reverts with "Wallet already accepted."

### 4.4 Public Testnet Deployment

Beyond the local Hardhat validation above, the identical registry and verifier were deployed to **HashKey Chain Testnet** (chain ID 133) at `0x22ec2ee3c88632f5a9c03afc74cb4027a54255ab` (verifier) and `0xe4a8412d544cf515eb869164855f24bc4d4fefd9` (registry). Correctness was confirmed independently via raw RPC calls rather than trusting the deployment script's own output: deployed bytecode size matches the compiled artifact at both addresses; `registry.verifier()` resolves to the deployed verifier; `registry.policyDigest()` equals `keccak256("vitapod-demo-metabolic-v1")`; and a real committed proof bundle (`eligible-proof.json`, EZKL v23.0.5) was simulated against `submit()` via `eth_call`, returning accepted at 648,593 gas. This demonstrates the Halo2 verification logic executes correctly on a public chain, not only against a local development node. The deployment used the publicly known Hardhat test account #1, funded with a small amount of testnet HSK for this purpose; mainnet (chain ID 177) was not touched. Both contracts were subsequently source-verified on the Blockscout explorer (`is_fully_verified: true`, `solc v0.8.28+commit.7893614a`, optimizer 200 runs, `cancun` EVM target); the verified source returned by the explorer was independently re-hashed and matches the committed source files byte-for-byte (`Halo2Verifier.sol` SHA-256 `271d1c26…`, `TrialProofRegistry.sol` SHA-256 `857f93d8…`), confirming the deployed bytecode, the explorer-verified source, and the repository's committed source are provably identical.

## 5. Discussion

### 5.1 Implications for Clinical Trial Privacy

VitaPod demonstrates that the cryptographic primitive for privacy-preserving eligibility verification is practical today. A 2-second proof and 27-millisecond verification are fast enough for interactive use. The architecture places **zero trust requirements** on any party: the patient generates the proof locally; the blockchain verifies it without learning the inputs; the registry records only that verification occurred.

This differs fundamentally from existing privacy approaches:
- **Tokenization** (Datavant) requires a trusted intermediary to hold linkage keys
- **Federated learning** requires trusting the aggregator
- **Homomorphic encryption** produces encrypted outputs that someone must decrypt

A zero-knowledge proof produces a **public, verifiable result** without any decryption step.

### 5.2 Integration with DeSci

VitaPod is designed to integrate with the DeSci ecosystem:

1. **Scientific Bounties**: A sponsor posts eligibility criteria on-chain with a bounty. Patients self-screen locally; proofs auto-claim the bounty when verified.

2. **Proof-of-Contribution**: Patients generate proofs throughout a trial (enrollment, milestones, completion). Accumulated proofs unlock practical benefits: drug access discounts, priority trial access, travel/time compensation, personal health insights, or patient advisory board roles. Sponsors choose the reward structure; VitaPod provides the verifiable substrate.

3. **Decentralized Trial Enrollment**: Self-screening → auto-enrollment → verified outcomes, all without a centralized data aggregator.

The legal and IP-NFT frameworks pioneered by Molecule and VitaDAO could layer additional incentive structures on top. But the missing component is the **verifiable substrate** — privacy-preserving proof that a contribution occurred. VitaPod provides that substrate.

### 5.3 Limitations

**Data provenance.** VitaPod proves that a computation ran correctly over a private witness. It does **not** prove that the witness came from a laboratory, EHR, or any authentic source. An attacker could generate a proof over fabricated data. Adding provenance requires integration with zkTLS [21], signed lab results, or hardware attestation — explicitly out of scope for this prototype.

**Identity binding.** The registry binds proofs to wallet addresses, not people. One person could submit from multiple wallets; multiple people could share a wallet. Binding a proof to a unique person requires a credential layer (e.g., World ID, zkPassport) — also out of scope.

**Regulatory compliance.** VitaPod does not establish HIPAA, FDA, or GDPR compliance. It uses synthetic data only. Real clinical deployment would require regulatory review, but the core privacy guarantees are mathematical, not policy-dependent.

**Model complexity.** The demonstrated policy is a simple threshold check. EZKL supports 18-million-parameter networks, but proof times scale with circuit size. A complex phenotype model would require quantization, accuracy validation, and regenerated verifiers.

### 5.4 Prior Art Positioning

We searched for open-source implementations combining EZKL, ONNX, a generated Solidity verifier, and an on-chain registry for clinical eligibility — and found no runnable example. Academic proposals (TeleZK-L2, CoSMeTIC, zkFL-Health) exist as papers without shipped code. Solve.Care's Care.Trials claims ZK usage but for identity, not zkML over biomarkers. EZKL's own documentation contains no healthcare example. VitaPod is the first **runnable reference implementation** of this specific combination — not a new idea, but the first proof that the idea works.

## 6. Future Work

Natural extensions include:

1. **Authenticated inputs** — Integration with zkTLS, signed lab results, or FHIR provenance to establish witness authenticity.

2. **Identity binding** — Credential layer to bind proofs to unique persons.

3. **Richer models** — Validated phenotype models (e.g., Alzheimer's biomarker panels) replacing simple thresholds.

4. **Browser-native proving** — WASM compilation of EZKL for fully in-browser proof generation.

5. **Multi-criteria policies** — Complex eligibility rules with AND/OR combinations across multiple biomarker panels.

6. **Pilot study** — Clinical design partner to measure: coordinator time savings, time from referral to decision, agreement between proof result and source verification.

## 7. Conclusion

We demonstrated VitaPod, a local-first data pod that generates zero-knowledge proofs of clinical trial eligibility without revealing biomarker values. Against a synthetic metabolic policy, the pipeline achieves 2.05-second proof generation and 27-millisecond on-chain verification, with health data remaining entirely local. The architecture is extensible — the same pipeline supports swapping in complex ML models. VitaPod provides the privacy primitive that Decentralized Science needs: cryptographic proof of eligibility without trust requirements.

The willingness gap is real and measurable. Patients will share data for research, but not with pharmaceutical companies. VitaPod demonstrates that this gap can be bridged architecturally, by changing what the sponsor receives from biomarker values to a mathematical proof that eligibility was computed correctly. The cryptographic tools are ready. What remains is clinical validation.

## Boundaries Statement

VitaPod is a synthetic-data technical prototype. It does not assess medical eligibility, authenticate laboratory results, identify a unique person, obtain informed consent, enroll participants, or establish regulatory compliance. Do not use with real health records.

## Code and Data

- **Code repository**: https://github.com/dyrtyData/VitaPod — React frontend, Solidity contracts, EZKL proving pipeline, Docker-first reproducibility.
- **Synthetic fixtures**: Committed in `prover/fixtures/` — fictional records not from any person.
- **License**: Code under MIT; this report under CC-BY-4.0.

## References

[1] npj Digital Medicine, August 2025. Meta-analysis of 65 studies across 34 countries on health data sharing willingness. https://www.nature.com/articles/s41746-025-01868-9

[2] Cascini et al., eClinicalMedicine 2024;69:102473. Systematic review of 116 studies (228,501 participants) on health data sharing preferences. https://pmc.ncbi.nlm.nih.gov/articles/PMC10963197/

[3] Craddock Lee et al., JCO 2019;37:1993-1996. NCI network trial accrual failures and cancer patient enrollment rates. https://ascopubs.org/doi/10.1200/JCO.19.00101

[4] Tufts CSDD, Therapeutic Innovation & Regulatory Science 2024. Clinical trial delays and costs. https://pubmed.ncbi.nlm.nih.gov/38773058/

[5] La Rosa et al., Cancer Medicine 2024. Qualitative study of 25 oncology trial professionals. https://pmc.ncbi.nlm.nih.gov/articles/PMC11612666/

[6] Molecule. IP-NFTs: Intellectual Property on the Blockchain. https://www.molecule.xyz/

[7] EZKL. Zero-knowledge machine learning. https://github.com/zkonduit/ezkl

[8] TeleZK-L2: A scalable zk-SNARK framework for privacy-preserving telehealth. Frontiers in Blockchain, 2026.

[9] TeleZK-FL: Trustless and verifiable remote patient monitoring via quantized zero-knowledge federated learning. Frontiers in Digital Health, 2026.

[10] zkFL-Health: Blockchain-Enabled Zero-Knowledge Federated Learning for Medical AI Privacy. arXiv:2512.21048, 2025.

[11] CoSMeTIC: Zero-Knowledge Computational Sparse Merkle Trees with Inclusion-Exclusion Proofs for Clinical Research. arXiv:2601.12136, January 2026.

[12] Solve.Care. Care.Trials: A Zero-Knowledge Clinical Trial Network. Medium, August 2023.

[13] Roots Analysis. Clinical Trial Patient Recruitment Services Market, 2025.

[14] Grand View Research. AI-Based Clinical Trial Solutions Market, 2024.

[15] Datavant. Analysis: 2025 Trends in Clinical Trial Tokenization. https://www.datavant.com/blog/datavant-analysis-2025-trends-in-clinical-trial-tokenization

[16] CISCRP. Perceptions & Insights Study, 2023. n=12,017 respondents. https://www.ciscrp.org/services/research-services/perceptions-insights-studies/

[2a] Mello et al. NEJM 2018. Survey of 771 clinical trial participants on data sharing preferences. https://www.nejm.org/doi/full/10.1056/NEJMsa1713258

[17] Advarra. Screen Failure in Clinical Trials: Causes, Consequences, and Solutions. https://www.advarra.com/resource-library/screen-failure-in-clinical-trials/

[18] HIPAA Journal. Clinical trial data breach reports, 2024–2026. https://www.hipaajournal.com/

[19] Drug Discovery Trends. Cencora data breach affecting clinical trial participants, 2024.

[20] Genome.gov. Genetic Discrimination — GINA coverage and gaps. https://www.genome.gov/about-genomics/policy-issues/Genetic-Discrimination

[21] TLSNotary. https://github.com/tlsnotary/tlsn

## LLM Usage Statement

We used LLM assistance (Claude) to help draft and structure this report, to scaffold code, and to conduct market research. All technical results (proof times, verification, architecture) are produced by the committed, deterministic pipeline and verified manually. Synthetic fixtures are hand-crafted, not LLM-generated.
