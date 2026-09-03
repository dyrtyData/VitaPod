import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { SyntheticLabRecord } from "@vitapod/shared";
import { describe, expect, it } from "vitest";
import { EligibilityPreview } from "../components/EligibilityPreview.js";
import { LocalPod } from "../components/LocalPod.js";

function IntakeHarness() {
  const [record, setRecord] = useState<SyntheticLabRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  return <><LocalPod onRecord={setRecord} onError={setError} /><EligibilityPreview record={record} preview={null} error={error} /></>;
}

describe("LocalPod", () => {
  async function upload(contents: string, name = "record.json", type = "application/json") {
    const user = userEvent.setup({ applyAccept: false });
    render(<IntakeHarness />);
    await user.upload(screen.getByLabelText("Choose synthetic JSON"), new File([contents], name, { type }));
  }

  it.each([
    ["{not json"],
    ['{"kind":"vitapod.synthetic-lab.v1","ageYears":45,"hba1cPercent":6.4,"egfrMlMin1_73m2":92,"unexpected":true}'],
    ['{"kind":"another.kind","ageYears":45,"hba1cPercent":6.4,"egfrMlMin1_73m2":92}'],
    ['{"kind":"vitapod.synthetic-lab.v1","ageYears":45,"hba1cPercent":5.70001,"egfrMlMin1_73m2":92}'],
  ])("shows a safe validation message for invalid JSON", async (contents: string) => {
    await upload(contents);
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a valid VitaPod synthetic JSON record.");
    expect(screen.queryByText(contents)).not.toBeInTheDocument();
  });

  it("rejects non-JSON files without reading their contents", async () => {
    await upload("private contents", "record.pdf", "application/pdf");
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JSON file for the synthetic record.");
    expect(screen.queryByText("private contents")).not.toBeInTheDocument();
  });
});
