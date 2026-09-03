import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { policyDigest } from "@vitapod/shared";
import { network } from "hardhat";
import { getAddress, parseAbiItem } from "viem";

// The Hardhat artifact ABI is not statically typed, so the event this script reads
// is declared here; contracts/test asserts the deployed ABI still matches it.
const proofAcceptedEvent = parseAbiItem(
  "event ProofAccepted(address indexed submitter, bytes32 indexed policyDigest, bytes32 indexed proofDigest)",
);

const contractsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const connection = await network.create();
const deploymentPath = resolve(
  contractsDir,
  "deployments",
  `${connection.networkName}.json`,
);

let deploymentSource: string;
try {
  deploymentSource = await readFile(deploymentPath, "utf8");
} catch {
  throw new Error(
    `No deployment record at ${deploymentPath}; run chain:deploy:local first`,
  );
}
const deployment = JSON.parse(deploymentSource) as { registryAddress: string };

const chainIdHex = await connection.provider.request({ method: "eth_chainId" });
const chainId = BigInt(chainIdHex as string);

const { viem } = connection;
const registry = await viem.getContractAt(
  "TrialProofRegistry",
  getAddress(deployment.registryAddress),
);
const publicClient = await viem.getPublicClient();

const onChainPolicyDigest = await registry.read.policyDigest!();
const verifierAddress = await registry.read.verifier!();

const events = await publicClient.getContractEvents({
  address: registry.address,
  abi: [proofAcceptedEvent],
  eventName: "ProofAccepted",
  fromBlock: 0n,
});

const acceptances = [];
for (const event of events) {
  const submitter = event.args.submitter;
  const proofDigest = event.args.proofDigest;
  if (submitter === undefined || proofDigest === undefined) {
    throw new Error(`ProofAccepted log in ${event.transactionHash} is missing indexed arguments`);
  }
  if (!(await registry.read.usedProofs!([proofDigest]))) {
    throw new Error(`Registry state disagrees with its logs: usedProofs(${proofDigest}) is false`);
  }
  acceptances.push({
    submitter,
    proofDigest,
    blockNumber: event.blockNumber.toString(),
    transactionHash: event.transactionHash,
  });
}

const submitters = [...new Set(acceptances.map((acceptance) => acceptance.submitter))];
for (const address of submitters) {
  if (!(await registry.read.hasAccepted!([address]))) {
    throw new Error(`Registry state disagrees with its logs: hasAccepted(${address}) is false`);
  }
}

console.log(
  JSON.stringify(
    {
      network: connection.networkName,
      chainId: chainId.toString(),
      registryAddress: registry.address,
      verifierAddress,
      policyDigest: onChainPolicyDigest,
      digestMatches: onChainPolicyDigest === policyDigest(),
      acceptances,
      submitters,
    },
    null,
    2,
  ),
);
