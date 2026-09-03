import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defineChain, encodeEventTopics, type Log } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OnChainVerification,
  registryAbi,
} from "../components/OnChainVerification.js";

const hooks = vi.hoisted(() => ({
  account: {
    address: "0x1000000000000000000000000000000000000001" as `0x${string}`,
    chainId: 31337,
    isConnected: true,
  },
  connect: vi.fn(),
  connectError: null as Error | null,
  connectPending: false,
  writeContract: vi.fn(),
  writeData: undefined as `0x${string}` | undefined,
  writeError: null as Error | null,
  writePending: false,
  receipt: {
    data: undefined as { logs: readonly Log[] } | undefined,
    error: null as Error | null,
    isLoading: false,
  },
}));

vi.mock("wagmi", () => ({
  useAccount: () => hooks.account,
  useConnect: () => ({
    connect: hooks.connect,
    connectors: [{ id: "injected", name: "Injected", type: "injected" }],
    error: hooks.connectError,
    isPending: hooks.connectPending,
  }),
  useWriteContract: () => ({
    data: hooks.writeData,
    error: hooks.writeError,
    isPending: hooks.writePending,
    writeContract: hooks.writeContract,
  }),
  useWaitForTransactionReceipt: () => hooks.receipt,
}));

const bundle = {
  format: "vitapod-proof-bundle.v1" as const,
  policyId: "vitapod-demo-metabolic-v1" as const,
  modelSha256: "ab".repeat(32),
  ezklVersion: "23.0.5",
  eligible: true,
  proof: "0x0102" as const,
  instances: ["1"],
};
const chainConfig = {
  chain: defineChain({
    id: 31337,
    name: "VitaPod local",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["http://localhost:8545"] } },
  }),
  registryAddress: "0x2000000000000000000000000000000000000002" as const,
};
const transactionHash = `0x${"33".repeat(32)}` as const;
const policyDigest = `0x${"44".repeat(32)}` as const;
const proofDigest = `0x${"55".repeat(32)}` as const;

beforeEach(() => {
  hooks.account.address = "0x1000000000000000000000000000000000000001";
  hooks.account.chainId = 31337;
  hooks.account.isConnected = true;
  hooks.connect.mockReset();
  hooks.connectError = null;
  hooks.connectPending = false;
  hooks.writeContract.mockReset();
  hooks.writeData = undefined;
  hooks.writeError = null;
  hooks.writePending = false;
  hooks.receipt = { data: undefined, error: null, isLoading: false };
});

describe("OnChainVerification", () => {
  it("requires a local proof bundle before exposing wallet actions", () => {
    render(<OnChainVerification bundle={null} chainConfig={chainConfig} />);

    expect(screen.getByText("Testnet technical verification — not trial enrollment")).toBeInTheDocument();
    expect(screen.getByText("Generate and import a local proof bundle first.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reports missing public chain configuration", () => {
    render(<OnChainVerification bundle={bundle} chainConfig={null} />);

    expect(screen.getByText("No public chain configured.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("refuses a wrong chain without sending or switching", async () => {
    hooks.account.chainId = 1;
    render(<OnChainVerification bundle={bundle} chainConfig={chainConfig} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "expected chain 31337, connected to 1",
    );
    expect(screen.queryByRole("button", { name: "Submit proof" })).not.toBeInTheDocument();
    expect(hooks.writeContract).not.toHaveBeenCalled();
  });

  it("shows a pending transaction hash without proof inputs", () => {
    hooks.writeData = transactionHash;
    hooks.receipt.isLoading = true;
    render(<OnChainVerification bundle={bundle} chainConfig={chainConfig} />);

    expect(screen.getByText(/Pending:/)).toHaveTextContent(transactionHash);
    expect(screen.queryByText("0x0102")).not.toBeInTheDocument();
    expect(screen.queryByText("instances", { exact: false })).not.toBeInTheDocument();
  });

  it("shows confirmed ProofAccepted metadata and no biomarkers", () => {
    const topics = encodeEventTopics({
      abi: registryAbi,
      eventName: "ProofAccepted",
      args: {
        submitter: hooks.account.address,
        policyDigest,
        proofDigest,
      },
    });
    hooks.writeData = transactionHash;
    hooks.receipt.data = {
      logs: [
        {
          address: chainConfig.registryAddress,
          blockHash: transactionHash,
          blockNumber: 1n,
          data: "0x",
          logIndex: 0,
          removed: false,
          topics,
          transactionHash,
          transactionIndex: 0,
        } as unknown as Log,
      ],
    };
    render(<OnChainVerification bundle={bundle} chainConfig={chainConfig} />);

    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.getAllByText(hooks.account.address).length).toBeGreaterThan(0);
    expect(screen.getByText(policyDigest)).toBeInTheDocument();
    expect(screen.getByText(proofDigest)).toBeInTheDocument();
    for (const privateLabel of ["ageYears", "hba1cPercent", "egfrMlMin1_73m2"]) {
      expect(screen.queryByText(privateLabel, { exact: false })).not.toBeInTheDocument();
    }
  });

  it("connects only through the injected connector", async () => {
    hooks.account.isConnected = false;
    const user = userEvent.setup();
    render(<OnChainVerification bundle={bundle} chainConfig={chainConfig} />);

    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(hooks.connect).toHaveBeenCalledWith({
      connector: expect.objectContaining({ type: "injected" }),
    });
  });

  it("maps replay failures to a safe demo message", () => {
    hooks.writeError = new Error("ContractFunctionRevertedError: ProofAlreadyUsed()");
    render(<OnChainVerification bundle={bundle} chainConfig={chainConfig} />);

    expect(screen.getByRole("alert")).toHaveTextContent("This proof was already used.");
    expect(screen.queryByText("0x0102")).not.toBeInTheDocument();
  });
});
