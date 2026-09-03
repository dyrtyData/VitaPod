import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ProofBundle,
  toVerifierArguments,
  type ProofBundle as ProofBundleType,
} from "@vitapod/shared";

export async function loadProofBundle(name: string): Promise<{
  bundle: ProofBundleType;
  proof: `0x${string}`;
  instances: bigint[];
}> {
  const path = resolve(process.cwd(), "../prover/artifacts", name);
  const bundle = ProofBundle.parse(JSON.parse(await readFile(path, "utf8")));
  return { bundle, ...toVerifierArguments(bundle) };
}
