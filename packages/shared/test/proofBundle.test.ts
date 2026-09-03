import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ProofBundle, toVerifierArguments } from "../src/index.js";

const validBundle = {
  format: "vitapod-proof-bundle.v1",
  policyId: "vitapod-demo-metabolic-v1",
  modelSha256: "a".repeat(64),
  ezklVersion: "23.0.5",
  eligible: true,
  proof: "0x0102",
  instances: ["1"],
} as const;

describe("ProofBundle", () => {
  it("accepts the strict, sanitized bundle contract", () => {
    expect(ProofBundle.parse(validBundle)).toEqual(validBundle);
  });

  it.each([
    ["wrong format", { ...validBundle, format: "vitapod-proof-bundle.v2" }],
    ["wrong policy", { ...validBundle, policyId: "another-policy" }],
    ["uppercase model digest", { ...validBundle, modelSha256: "A".repeat(64) }],
    ["short model digest", { ...validBundle, modelSha256: "a".repeat(63) }],
    ["non-byte proof", { ...validBundle, proof: "0x123" }],
    ["empty proof", { ...validBundle, proof: "0x" }],
    ["hex instance", { ...validBundle, instances: ["0x1"] }],
    ["leading-zero instance", { ...validBundle, instances: ["01"] }],
    ["too many instances", { ...validBundle, instances: ["1", "1"] }],
    ["non-boolean output", { ...validBundle, instances: ["2"] }],
    ["inconsistent output", { ...validBundle, eligible: false }],
    ["unknown key", { ...validBundle, ageYears: 45 }],
  ])("rejects %s", (_label, value) => {
    expect(ProofBundle.safeParse(value).success).toBe(false);
  });

  it("rejects a decimal value above uint256", () => {
    const aboveUint256 = (1n << 256n).toString();
    expect(ProofBundle.safeParse({ ...validBundle, instances: [aboveUint256] }).success).toBe(false);
  });

  it("converts the validated payload to verifier-native values", () => {
    expect(toVerifierArguments(ProofBundle.parse(validBundle))).toEqual({
      proof: "0x0102",
      instances: [1n],
    });
  });

  it("parses the real generated eligible bundle when the proof pipeline has run", () => {
    const path = fileURLToPath(
      new URL("../../../prover/artifacts/eligible-proof.json", import.meta.url),
    );
    if (!existsSync(path)) return;

    const generated = ProofBundle.parse(JSON.parse(readFileSync(path, "utf8")));
    expect(generated.eligible).toBe(true);
    expect(generated.instances).toEqual(["1"]);
  });
});
