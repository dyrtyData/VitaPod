import type { EligibilityResult, SyntheticLabRecord } from "@vitapod/shared";

interface EligibilityPreviewProps {
  record: SyntheticLabRecord | null;
  preview: EligibilityResult | null;
  error: string | null;
}

export function EligibilityPreview({ record, preview, error }: EligibilityPreviewProps) {
  if (error) return <p className="status-message status-message--error" role="alert">{error}</p>;

  if (!record || !preview) {
    return <p className="status-message">Choose a synthetic record to see its local preview.</p>;
  }

  return (
    <div className="preview" aria-live="polite">
      <dl className="record-values">
        <div><dt>Age</dt><dd>{record.ageYears} years</dd></div>
        <div><dt>HbA1c</dt><dd>{record.hba1cPercent}%</dd></div>
        <div><dt>eGFR</dt><dd>{record.egfrMlMin1_73m2}</dd></div>
      </dl>
      <div className={`outcome outcome--${preview.eligible ? "eligible" : "ineligible"}`}>
        <span className="outcome__dot" aria-hidden="true" />
        <strong>{preview.eligible ? "eligible" : "ineligible"}</strong>
        <span>preview, not a decision</span>
      </div>
      <p className="policy-id">Policy: <code>{preview.policyId}</code></p>
    </div>
  );
}
