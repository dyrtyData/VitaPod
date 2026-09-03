import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const EIP170_LIMIT = 24_576;
const artifactPath = resolve(
  process.cwd(),
  "artifacts/contracts/generated/Halo2Verifier.sol/Halo2Verifier.json",
);
const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as {
  deployedBytecode: string;
};
const runtimeBytes = (artifact.deployedBytecode.length - 2) / 2;

if (!Number.isInteger(runtimeBytes) || runtimeBytes <= 0) {
  throw new Error("Halo2Verifier runtime bytecode is missing");
}
if (runtimeBytes > EIP170_LIMIT) {
  throw new Error(
    `Halo2Verifier runtime bytecode is ${runtimeBytes} bytes; EIP-170 permits ${EIP170_LIMIT}`,
  );
}

console.log(`Halo2Verifier runtime bytecode: ${runtimeBytes}/${EIP170_LIMIT} bytes`);
