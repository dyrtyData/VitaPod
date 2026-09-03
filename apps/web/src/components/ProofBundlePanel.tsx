import { ProofBundle, type ProofBundle as ProofBundleType } from "@vitapod/shared";
import { useId, useState, type ChangeEvent } from "react";

interface ProofBundlePanelProps {
  onBundle: (bundle: ProofBundleType | null) => void;
}

const INVALID_BUNDLE_MESSAGE = "Choose a valid VitaPod proof-bundle JSON file.";
const NON_JSON_MESSAGE = "Choose a JSON file for the local proof bundle.";

function looksLikeJson(file: File): boolean {
  return file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
}

function shortDigest(digest: string): string {
  return `${digest.slice(0, 10)}...${digest.slice(-8)}`;
}

export function ProofBundlePanel({ onBundle }: ProofBundlePanelProps) {
  const inputId = useId();
  const [bundle, setBundle] = useState<ProofBundleType | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reject(message: string) {
    setBundle(null);
    onBundle(null);
    setError(message);
  }

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;
    if (!looksLikeJson(file)) {
      reject(NON_JSON_MESSAGE);
      return;
    }

    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const parsedBundle = ProofBundle.safeParse(parsedJson);
      if (!parsedBundle.success) {
        reject(INVALID_BUNDLE_MESSAGE);
        return;
      }

      setError(null);
      setBundle(parsedBundle.data);
      onBundle(parsedBundle.data);
    } catch {
      reject(INVALID_BUNDLE_MESSAGE);
    }
  }

  return (
    <section aria-labelledby="proof-bundle-heading">
      <p className="eyebrow">Local verifier artifact</p>
      <h2 id="proof-bundle-heading">Import a proof bundle</h2>
      <p className="supporting-copy">
        Generated locally by the CLI proof pipeline for a synthetic input.
      </p>
      <label className="file-picker file-picker--proof" htmlFor={inputId}>
        <span className="file-picker__icon" aria-hidden="true">◇</span>
        <span>
          <strong>Choose proof bundle</strong>
          <small>Only a local JSON file is read</small>
        </span>
      </label>
      <input
        id={inputId}
        aria-label="Choose proof bundle JSON"
        className="sr-only"
        type="file"
        onChange={handleSelection}
      />
      {error ? <p className="status-message status-message--error" role="alert">{error}</p> : null}
      {bundle ? (
        <div className="bundle-summary" aria-live="polite">
          <div className={`outcome outcome--${bundle.eligible ? "eligible" : "ineligible"}`}>
            <span className="outcome__dot" aria-hidden="true" />
            <strong>{bundle.eligible ? "eligible" : "ineligible"}</strong>
            <span>public proof output</span>
          </div>
          <dl className="bundle-metadata">
            <div><dt>Policy</dt><dd><code>{bundle.policyId}</code></dd></div>
            <div><dt>Model SHA-256</dt><dd><code title={bundle.modelSha256}>{shortDigest(bundle.modelSha256)}</code></dd></div>
            <div><dt>EZKL</dt><dd><code>{bundle.ezklVersion}</code></dd></div>
          </dl>
          <p className="bundle-summary__note">Proof bytes loaded in memory; private source values are not part of this bundle.</p>
        </div>
      ) : null}
    </section>
  );
}
