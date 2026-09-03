import { z } from "zod";

// The circuit only ever sees integers, so every value must be exactly representable
// before it reaches the boundary: whole years, whole eGFR units, and HbA1c as an exact
// tenth of a percent. The tenth check is done on the decimal string, never with float
// arithmetic, so 5.7 passes and 5.70001 is rejected here and in prover/src/normalization.py.
const EXACT_TENTH = /^\d+(\.\d)?$/;

export function isExactTenth(value: number): boolean {
  return EXACT_TENTH.test(String(value));
}

export const SyntheticLabRecord = z
  .object({
    kind: z.literal("vitapod.synthetic-lab.v1"),
    ageYears: z.number().int().min(0).max(130),
    hba1cPercent: z
      .number()
      .min(0)
      .max(20)
      .refine(isExactTenth, { message: "hba1cPercent must be an exact tenth (e.g. 5.7)" }),
    egfrMlMin1_73m2: z.number().int().min(0).max(200),
  })
  .strict();

export type SyntheticLabRecord = z.infer<typeof SyntheticLabRecord>;

/** Circuit witness layout: `[ageYears, hba1cPercent * 10, egfrMlMin1_73m2]`, all integers. */
export type FixedPointWitness = [number, number, number];

export function normalizeToFixedPoint(record: SyntheticLabRecord): FixedPointWitness {
  const [whole, tenth = "0"] = String(record.hba1cPercent).split(".");
  const hba1cTenths = Number(whole) * 10 + Number(tenth);
  return [record.ageYears, hba1cTenths, record.egfrMlMin1_73m2];
}
