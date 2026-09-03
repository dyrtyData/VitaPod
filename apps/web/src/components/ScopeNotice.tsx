export function ScopeNotice() {
  return (
    <aside className="scope-notice" aria-label="Prototype scope notice">
      <span className="scope-notice__marker" aria-hidden="true">01</span>
      <div>
        <p className="scope-notice__label">Read this first</p>
        <p>
          VitaPod is a synthetic-data technical prototype. It does not assess medical eligibility,
          authenticate a laboratory result, enroll a participant, or send health data to a research
          sponsor. Do not use it with real health records.
        </p>
        <p className="scope-notice__detail">Your selected record remains in this browser and is not uploaded.</p>
      </div>
    </aside>
  );
}
