import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  POLICY_ID,
  SyntheticLabRecord,
  evaluateDemoPolicy,
  normalizeToFixedPoint,
  policyDigest,
} from "../src/index.js";

const fixturesDir = fileURLToPath(new URL("../../../prover/fixtures/", import.meta.url));

function loadFixture(name: string): SyntheticLabRecord {
  return SyntheticLabRecord.parse(JSON.parse(readFileSync(`${fixturesDir}${name}`, "utf8")));
}

const valid = {
  kind: "vitapod.synthetic-lab.v1",
  ageYears: 45,
  hba1cPercent: 6.4,
  egfrMlMin1_73m2: 92,
} as const;

describe("SyntheticLabRecord", () => {
  it("accepts a well-formed record", () => {
    expect(SyntheticLabRecord.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["unknown field", { ...valid, name: "x" }],
    ["wrong kind", { ...valid, kind: "vitapod.synthetic-lab.v2" }],
    ["missing field", { kind: valid.kind, ageYears: 45, hba1cPercent: 6.4 }],
    ["fractional age", { ...valid, ageYears: 45.5 }],
    ["age above range", { ...valid, ageYears: 131 }],
    ["hba1c not an exact tenth", { ...valid, hba1cPercent: 5.70001 }],
    ["hba1c with two decimals", { ...valid, hba1cPercent: 6.45 }],
    ["hba1c above range", { ...valid, hba1cPercent: 20.1 }],
    ["fractional egfr", { ...valid, egfrMlMin1_73m2: 60.5 }],
    ["egfr above range", { ...valid, egfrMlMin1_73m2: 201 }],
    ["negative egfr", { ...valid, egfrMlMin1_73m2: -1 }],
    ["string number", { ...valid, ageYears: "45" }],
  ])("rejects %s", (_label, input) => {
    expect(SyntheticLabRecord.safeParse(input).success).toBe(false);
  });
});

describe("normalizeToFixedPoint", () => {
  it.each([
    [5.7, 57],
    [8.5, 85],
    [6.4, 64],
    [0, 0],
    [20, 200],
    [10.1, 101],
  ])("encodes hba1c %s as %s tenths", (hba1cPercent, tenths) => {
    const record = SyntheticLabRecord.parse({ ...valid, hba1cPercent });
    expect(normalizeToFixedPoint(record)).toEqual([45, tenths, 92]);
  });

  it("round-trips every committed fixture into integers", () => {
    for (const name of [
      "eligible.json",
      "ineligible.json",
      "boundary-age-18.json",
      "boundary-hba1c-5.7.json",
      "boundary-hba1c-8.5.json",
      "boundary-egfr-60.json",
    ]) {
      const witness = normalizeToFixedPoint(loadFixture(name));
      expect(witness.every(Number.isInteger), name).toBe(true);
    }
  });
});

describe("evaluateDemoPolicy", () => {
  it.each([
    ["eligible.json", true],
    ["ineligible.json", false],
    ["boundary-age-18.json", true],
    ["boundary-hba1c-5.7.json", true],
    ["boundary-hba1c-8.5.json", false],
    ["boundary-egfr-60.json", true],
  ])("%s → eligible=%s", (name, eligible) => {
    expect(evaluateDemoPolicy(loadFixture(name))).toEqual({ policyId: POLICY_ID, eligible });
  });

  it.each([
    ["age 17", { ...valid, ageYears: 17 }, false],
    ["age 18", { ...valid, ageYears: 18 }, true],
    ["hba1c 5.6", { ...valid, hba1cPercent: 5.6 }, false],
    ["hba1c 5.7", { ...valid, hba1cPercent: 5.7 }, true],
    ["hba1c 8.4", { ...valid, hba1cPercent: 8.4 }, true],
    ["hba1c 8.5", { ...valid, hba1cPercent: 8.5 }, false],
    ["egfr 59", { ...valid, egfrMlMin1_73m2: 59 }, false],
    ["egfr 60", { ...valid, egfrMlMin1_73m2: 60 }, true],
  ])("threshold edge %s → %s", (_label, input, eligible) => {
    expect(evaluateDemoPolicy(SyntheticLabRecord.parse(input)).eligible).toBe(eligible);
  });
});

describe("policyDigest", () => {
  it("is the EVM keccak256 (not SHA3-256) of the policy id", () => {
    // keccak256("") is the Ethereum test vector; SHA3-256("") would start with a7ffc6f8.
    expect(bytesToHex(keccak_256(new Uint8Array()))).toBe(
      "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(policyDigest()).toBe(
      `0x${bytesToHex(keccak_256(new TextEncoder().encode("vitapod-demo-metabolic-v1")))}`,
    );
    expect(policyDigest()).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
