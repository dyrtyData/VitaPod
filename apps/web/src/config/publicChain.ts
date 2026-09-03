import { defineChain, getAddress, isAddress, type Address, type Chain } from "viem";

export interface PublicChainConfig {
  chain: Chain;
  registryAddress: Address;
}

interface PublicChainEnvironment {
  readonly [key: string]: string | boolean | undefined;
  VITE_CHAIN_ID?: string;
  VITE_RPC_URL?: string;
  VITE_REGISTRY_ADDRESS?: string;
}

export function parsePublicChain(
  environment: PublicChainEnvironment,
): PublicChainConfig | undefined {
  const { VITE_CHAIN_ID: chainIdValue, VITE_RPC_URL: rpcUrl, VITE_REGISTRY_ADDRESS: address } =
    environment;
  if (!chainIdValue || !rpcUrl || !address) return undefined;
  if (!/^\d+$/.test(chainIdValue) || !/^https?:\/\//.test(rpcUrl) || !isAddress(address)) {
    return undefined;
  }

  const chainId = Number(chainIdValue);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) return undefined;

  return {
    chain: defineChain({
      id: chainId,
      name: chainId === 31337 ? "VitaPod local" : "VitaPod configured chain",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    }),
    registryAddress: getAddress(address),
  };
}

export const publicChain = parsePublicChain(import.meta.env);
