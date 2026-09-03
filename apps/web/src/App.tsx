import {
  evaluateDemoPolicy,
  type ProofBundle as ProofBundleType,
  type SyntheticLabRecord,
} from "@vitapod/shared";
import { useState } from "react";
import { EligibilityPreview } from "./components/EligibilityPreview.js";
import { LocalPod } from "./components/LocalPod.js";
import { ProofBundlePanel } from "./components/ProofBundlePanel.js";
import { ScopeNotice } from "./components/ScopeNotice.js";

export default function App() {
  const [record, setRecord] = useState<SyntheticLabRecord | null>(null);
  const [, setBundle] = useState<ProofBundleType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = record ? evaluateDemoPolicy(record) : null;

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="hero__kicker">VitaPod / local-first prototype</p>
        <h1>See the computation.<br /><em>Keep the record.</em></h1>
        <p className="hero__lede">A transparent demonstration of a fixed rule over a synthetic record, held in browser memory.</p>
      </header>
      <ScopeNotice />
      <div className="flow-key" aria-label="Privacy flow">
        <span>Private source</span><i aria-hidden="true" /><span>Local artifact</span><i aria-hidden="true" /><span>Public metadata</span>
      </div>
      <div className="privacy-columns">
        <article className="privacy-card privacy-card--local">
          <header><span>01</span><h2>Stays in this browser</h2></header>
          <LocalPod onRecord={setRecord} onError={setError} />
          <EligibilityPreview record={record} preview={preview} error={error} />
        </article>
        <article className="privacy-card privacy-card--artifact">
          <header><span>02</span><h2>Local proof artifact</h2></header>
          <ProofBundlePanel onBundle={setBundle} />
        </article>
        <article className="privacy-card privacy-card--chain">
          <header><span>03</span><h2>Public chain metadata</h2></header>
          <p className="eyebrow">Not active yet</p>
          <p className="chain-copy">Nothing is published by this page.</p>
          <div className="empty-state empty-state--small"><span aria-hidden="true">○</span><p>Wallet and chain verification arrive only after a real local proof exists.</p></div>
        </article>
      </div>
    </main>
  );
}
