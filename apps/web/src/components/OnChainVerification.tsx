import { toVerifierArguments, type ProofBundle } from "@vitapod/shared";
import { decodeEventLog, type Hash, type Log } from "viem";
import {
  useAccount,
  useConnect,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { publicChain, type PublicChainConfig } from "../config/publicChain.js";

export const registryAbi = [
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "instances", type: "uint256[]" },
    ],
    outputs: [],
  },
  { type: "error", name: "InvalidProof", inputs: [] },
  { type: "error", name: "NotEligible", inputs: [] },
  { type: "error", name: "ProofAlreadyUsed", inputs: [] },
  { type: "error", name: "WalletAlreadyAccepted", inputs: [] },
  {
    type: "event",
    name: "ProofAccepted",
    inputs: [
      { name: "submitter", type: "address", indexed: true },
      { name: "policyDigest", type: "bytes32", indexed: true },
      { name: "proofDigest", type: "bytes32", indexed: true },
    ],
  },
] as const;

interface OnChainVerificationProps {
  bundle: ProofBundle | null;
  chainConfig?: PublicChainConfig | null;
}

interface AcceptedReceipt {
  submitter: `0x${string}`;
  policyDigest: Hash;
  proofDigest: Hash;
}

function decodeAcceptedReceipt(
  logs: readonly Log[],
  registryAddress: `0x${string}`,
): AcceptedReceipt | undefined {
  for (const log of logs) {
    if (log.address.toLowerCase() !== registryAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "ProofAccepted") return decoded.args;
    } catch {
      continue;
    }
  }
  return undefined;
}

function safeWriteError(error: Error | null): string | null {
  if (!error) return null;
  if (error.message.includes("ProofAlreadyUsed")) return "This proof was already used.";
  if (error.message.includes("WalletAlreadyAccepted")) {
    return "This wallet has already accepted this trial demonstration.";
  }
  if (error.message.includes("NotEligible")) return "The proof output is not eligible.";
  if (error.message.includes("InvalidProof")) return "The verifier rejected this proof.";
  return "The wallet did not submit the proof. Review the wallet prompt and try again.";
}

function WalletAction({
  bundle,
  chainConfig,
}: {
  bundle: ProofBundle;
  chainConfig: PublicChainConfig;
}) {
  const account = useAccount();
  const connect = useConnect();
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    chainId: chainConfig.chain.id,
  });
  const accepted = receipt.data
    ? decodeAcceptedReceipt(receipt.data.logs, chainConfig.registryAddress)
    : undefined;
  const wrongChain = account.isConnected && account.chainId !== chainConfig.chain.id;
  const verifierArguments = toVerifierArguments(bundle);

  function connectInjected() {
    const connector = connect.connectors.find((candidate) => candidate.type === "injected");
    if (connector) connect.connect({ connector });
  }

  function submitProof() {
    if (wrongChain) return;
    write.writeContract({
      abi: registryAbi,
      address: chainConfig.registryAddress,
      functionName: "submit",
      args: [verifierArguments.proof, verifierArguments.instances],
      chainId: chainConfig.chain.id,
    });
  }

  if (!account.isConnected) {
    return (
      <>
        <p className="chain-status">Connect an injected test wallet to the configured chain.</p>
        <button className="chain-action" type="button" onClick={connectInjected} disabled={connect.isPending}>
          {connect.isPending ? "Waiting for wallet" : "Connect"}
        </button>
        {connect.error ? <p className="chain-status chain-status--error">The wallet connection was not approved.</p> : null}
      </>
    );
  }

  return (
    <>
      <dl className="wallet-metadata">
        <div><dt>Wallet</dt><dd><code>{account.address}</code></dd></div>
        <div><dt>Chain</dt><dd>{chainConfig.chain.name} ({account.chainId})</dd></div>
        <div><dt>Registry</dt><dd><code>{chainConfig.registryAddress}</code></dd></div>
      </dl>
      {wrongChain ? (
        <p className="chain-status chain-status--error" role="alert">
          Wrong network: expected chain {chainConfig.chain.id}, connected to {account.chainId}. Switch manually; VitaPod will not send this transaction.
        </p>
      ) : (
        <button className="chain-action" type="button" onClick={submitProof} disabled={write.isPending || receipt.isLoading}>
          {write.isPending ? "Confirm in wallet" : "Submit proof"}
        </button>
      )}
      {write.data && !accepted ? (
        <p className="chain-status" aria-live="polite">Pending: <code>{write.data}</code></p>
      ) : null}
      {receipt.error ? <p className="chain-status chain-status--error">The transaction was not confirmed.</p> : null}
      {safeWriteError(write.error) ? (
        <p className="chain-status chain-status--error" role="alert">{safeWriteError(write.error)}</p>
      ) : null}
      {accepted ? (
        <div className="receipt-panel" aria-live="polite">
          <strong>Confirmed</strong>
          <dl className="wallet-metadata">
            <div><dt>Transaction</dt><dd><code>{write.data}</code></dd></div>
            <div><dt>Submitter</dt><dd><code>{accepted.submitter}</code></dd></div>
            <div><dt>Policy digest</dt><dd><code>{accepted.policyDigest}</code></dd></div>
            <div><dt>Proof digest</dt><dd><code>{accepted.proofDigest}</code></dd></div>
          </dl>
        </div>
      ) : null}
    </>
  );
}

export function OnChainVerification({
  bundle,
  chainConfig,
}: OnChainVerificationProps) {
  const resolvedChain = chainConfig === undefined ? publicChain : chainConfig;
  return (
    <section aria-labelledby="chain-verification-heading">
      <p className="eyebrow">Verifier receipt</p>
      <h2 id="chain-verification-heading">Verify on chain</h2>
      <p className="chain-disclosure">Testnet technical verification — not trial enrollment</p>
      {!bundle ? (
        <p className="chain-status">Generate and import a local proof bundle first.</p>
      ) : !resolvedChain ? (
        <p className="chain-status">No public chain configured.</p>
      ) : (
        <WalletAction bundle={bundle} chainConfig={resolvedChain} />
      )}
    </section>
  );
}
