export function ProofBundlePanel() {
  return (
    <section aria-labelledby="proof-bundle-heading">
      <p className="eyebrow">Next step</p>
      <h2 id="proof-bundle-heading">Proof bundle</h2>
      <div className="empty-state">
        <span className="empty-state__symbol" aria-hidden="true">◇</span>
        <p>A local proof artifact will appear here in the next phase.</p>
        <small>It will be generated locally by the CLI proof pipeline for a synthetic input.</small>
      </div>
    </section>
  );
}
