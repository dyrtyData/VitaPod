import { defineChain, http } from "viem";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { publicChain } from "../config/publicChain.js";

const unconfiguredChain = defineChain({
  id: 31337,
  name: "VitaPod local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://localhost:8545"] } },
});
const configuredChain = publicChain?.chain ?? unconfiguredChain;
const rpcUrl = configuredChain.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  chains: [configuredChain],
  connectors: [injected()],
  storage: null,
  transports: {
    [configuredChain.id]: http(rpcUrl),
  },
});
