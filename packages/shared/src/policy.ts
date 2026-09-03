import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { normalizeToFixedPoint, type SyntheticLabRecord } from "./clinicalData.js";

export type Hex = `0x${string}`;

export const POLICY_ID = "vitapod-demo-metabolic-v1";

// Thresholds in circuit units (HbA1c in tenths of a percent). These values are
// deliberately illustrative for a synthetic-data demo; they are not clinical guidance.
// prover/src/model.py encodes the same four comparisons in the ONNX graph.
export const POLICY_THRESHOLDS = {
  minAgeYears: 18,
  minHba1cTenths: 57,
  maxHba1cTenthsExclusive: 85,
  minEgfr: 60,
} as const;

export interface EligibilityResult {
  policyId: string;
  eligible: boolean;
}

export function evaluateDemoPolicy(record: SyntheticLabRecord): EligibilityResult {
  const [age, hba1cTenths, egfr] = normalizeToFixedPoint(record);
  const eligible =
    age >= POLICY_THRESHOLDS.minAgeYears &&
    hba1cTenths >= POLICY_THRESHOLDS.minHba1cTenths &&
    hba1cTenths < POLICY_THRESHOLDS.maxHba1cTenthsExclusive &&
    egfr >= POLICY_THRESHOLDS.minEgfr;
  return { policyId: POLICY_ID, eligible };
}

/** keccak256 of the UTF-8 policy id; the registry contract stores the same value. */
export function policyDigest(): Hex {
  return `0x${bytesToHex(keccak_256(new TextEncoder().encode(POLICY_ID)))}`;
}
