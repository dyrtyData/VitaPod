import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { network } from "hardhat";

const contractsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryDir = resolve(contractsDir, "..");

function expectedChainId(networkName: string): bigint {
  const configured = process.env.EXPECTED_CHAIN_ID;
  if (configured === undefined || configured === "") {
    if (networkName === "localhost") return 31337n;
    throw new Error("EXPECTED_CHAIN_ID is required before remote deployment");
  }
  if (!/^\d+$/.test(configured)) {
    throw new Error("EXPECTED_CHAIN_ID must be a positive decimal integer");
  }
  return BigInt(configured);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const connection = await network.create();
const actualHex = await connection.provider.request({ method: "eth_chainId" });
const chainId = BigInt(actualHex as string);
const expected = expectedChainId(connection.networkName);
if (chainId !== expected) {
  throw new Error(`Refusing deployment on chain ${chainId}; expected ${expected}`);
}

const { viem } = connection;
const [deployer] = await viem.getWalletClients();
if (!deployer) throw new Error("No deployer account is available on the selected network");

const verifier = await viem.deployContract("Halo2Verifier");
const registry = await viem.deployContract("TrialProofRegistry", [verifier.address]);
const artifactSource = await readFile(
  resolve(contractsDir, "artifacts/contracts/TrialProofRegistry.sol/TrialProofRegistry.json"),
  "utf8",
);
const browserRpc =
  connection.networkName === "localhost"
    ? "http://localhost:8545"
    : process.env.RPC_URL;
if (!browserRpc) throw new Error("RPC_URL is required for the browser deployment config");

const deployment = {
  network: connection.networkName,
  chainId: chainId.toString(),
  deployer: deployer.account.address,
  verifierAddress: verifier.address,
  registryAddress: registry.address,
  registryArtifactSha256: sha256(artifactSource),
  createdAt: new Date().toISOString(),
};
const deploymentPath = resolve(contractsDir, "deployments", `${connection.networkName}.json`);
await mkdir(dirname(deploymentPath), { recursive: true });
await writeFile(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

const webEnvPath = resolve(repositoryDir, "apps/web/.env.local");
await writeFile(
  webEnvPath,
  [
    `VITE_CHAIN_ID=${chainId}`,
    `VITE_RPC_URL=${browserRpc}`,
    `VITE_REGISTRY_ADDRESS=${registry.address}`,
    "",
  ].join("\n"),
);

console.log(JSON.stringify(deployment, null, 2));
