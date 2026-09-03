import { z } from "zod";
import { POLICY_ID, type Hex } from "./policy.js";

const UINT256_MAX = (1n << 256n) - 1n;

const modelSha256 = z.string().regex(/^[0-9a-f]{64}$/, {
  message: "modelSha256 must be a lowercase SHA-256 digest",
});

const hexBytes = z.string().regex(/^0x(?:[0-9a-fA-F]{2})+$/, {
  message: "proof must be a non-empty, byte-aligned hex string",
});

const uint256String = z
  .string()
  .regex(/^(0|[1-9]\d*)$/, { message: "instances must be canonical decimal strings" })
  .refine((value) => BigInt(value) <= UINT256_MAX, {
    message: "instance exceeds uint256",
  });

export const ProofBundle = z
  .object({
    format: z.literal("vitapod-proof-bundle.v1"),
    policyId: z.literal(POLICY_ID),
    modelSha256,
    ezklVersion: z.string().min(1),
    eligible: z.boolean(),
    proof: hexBytes,
    instances: z.array(uint256String).length(1),
  })
  .strict()
  .superRefine((bundle, context) => {
    const publicOutput = BigInt(bundle.instances[0] ?? "2");
    if (publicOutput !== 0n && publicOutput !== 1n) {
      context.addIssue({
        code: "custom",
        message: "the public eligibility output must be 0 or 1",
        path: ["instances", 0],
      });
      return;
    }

    if (bundle.eligible !== (publicOutput === 1n)) {
      context.addIssue({
        code: "custom",
        message: "eligible must match the public eligibility output",
        path: ["eligible"],
      });
    }
  });

export type ProofBundle = z.infer<typeof ProofBundle>;

export interface VerifierArguments {
  proof: Hex;
  instances: bigint[];
}

export function toVerifierArguments(bundle: ProofBundle): VerifierArguments {
  return {
    proof: bundle.proof as Hex,
    instances: bundle.instances.map((instance) => BigInt(instance)),
  };
}
