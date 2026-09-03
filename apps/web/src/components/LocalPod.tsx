import { SyntheticLabRecord, type SyntheticLabRecord as SyntheticLabRecordType } from "@vitapod/shared";
import { useId, type ChangeEvent } from "react";

interface LocalPodProps {
  onRecord: (record: SyntheticLabRecordType) => void;
  onError: (message: string | null) => void;
}

const INVALID_RECORD_MESSAGE = "Choose a valid VitaPod synthetic JSON record.";
const NON_JSON_MESSAGE = "Choose a JSON file for the synthetic record.";

function looksLikeJson(file: File): boolean {
  return file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
}

export function LocalPod({ onRecord, onError }: LocalPodProps) {
  const inputId = useId();

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;
    if (!looksLikeJson(file)) {
      onError(NON_JSON_MESSAGE);
      return;
    }

    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const parsedRecord = SyntheticLabRecord.safeParse(parsedJson);
      if (!parsedRecord.success) {
        onError(INVALID_RECORD_MESSAGE);
        return;
      }

      onError(null);
      onRecord(parsedRecord.data);
    } catch {
      onError(INVALID_RECORD_MESSAGE);
    }
  }

  return (
    <section aria-labelledby="local-pod-heading">
      <p className="eyebrow">Private input</p>
      <h2 id="local-pod-heading">Open a synthetic record</h2>
      <p className="supporting-copy">Parse and evaluate a JSON fixture in memory only.</p>
      <label className="file-picker" htmlFor={inputId}>
        <span className="file-picker__icon" aria-hidden="true">+</span>
        <span>
          <strong>Choose synthetic JSON</strong>
          <small>Only a local file is read</small>
        </span>
      </label>
      <input id={inputId} aria-label="Choose synthetic JSON" className="sr-only" type="file" onChange={handleSelection} />
    </section>
  );
}
