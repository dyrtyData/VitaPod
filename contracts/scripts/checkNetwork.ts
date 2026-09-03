import { network } from "hardhat";

function expectedChainId(networkName: string): bigint {
  const configured = process.env.EXPECTED_CHAIN_ID;
  if (configured === undefined || configured === "") {
    if (networkName === "localhost") return 31337n;
    throw new Error("EXPECTED_CHAIN_ID is required for remote network access");
  }

  if (!/^\d+$/.test(configured)) {
    throw new Error("EXPECTED_CHAIN_ID must be a positive decimal integer");
  }
  return BigInt(configured);
}

const connection = await network.create();
const actualHex = await connection.provider.request({ method: "eth_chainId" });
const actual = BigInt(actualHex as string);
const expected = expectedChainId(connection.networkName);

console.log(actual.toString());
if (actual !== expected) {
  throw new Error(`Refusing network ${actual}; expected chain ${expected}`);
}
