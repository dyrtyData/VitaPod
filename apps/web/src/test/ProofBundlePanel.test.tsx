import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProofBundlePanel } from "../components/ProofBundlePanel.js";

const validBundle = {
  format: "vitapod-proof-bundle.v1",
  policyId: "vitapod-demo-metabolic-v1",
  modelSha256: "a1".repeat(32),
  ezklVersion: "23.0.5",
  eligible: true,
  proof: "0x0102",
  instances: ["1"],
};

async function upload(value: unknown, onBundle = vi.fn()) {
  const user = userEvent.setup({ applyAccept: false });
  render(<ProofBundlePanel onBundle={onBundle} />);
  const file = new File([JSON.stringify(value)], "eligible-proof.json", {
    type: "application/json",
  });
  await user.upload(screen.getByLabelText("Choose proof bundle JSON"), file);
  return onBundle;
}

describe("ProofBundlePanel", () => {
  it("shows the labelled digest and public output from a valid bundle", async () => {
    const onBundle = await upload(validBundle);

    expect(await screen.findByText("eligible", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("vitapod-demo-metabolic-v1")).toBeInTheDocument();
    expect(screen.getByText("a1a1a1a1a1...a1a1a1a1")).toBeInTheDocument();
    expect(screen.getByText("23.0.5")).toBeInTheDocument();
    expect(screen.getByText(/Generated locally by the CLI proof pipeline/)).toBeInTheDocument();
    expect(onBundle).toHaveBeenCalledWith(validBundle);
    expect(screen.queryByText("instances", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("0x0102")).not.toBeInTheDocument();
  });

  it.each([
    ["wrong format", { ...validBundle, format: "vitapod-proof-bundle.v2" }],
    ["unknown key", { ...validBundle, ageYears: 45 }],
    ["inconsistent output", { ...validBundle, eligible: false }],
  ])("rejects %s without rendering private-looking values", async (_label, value) => {
    const onBundle = await upload(value);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a valid VitaPod proof-bundle JSON file.",
    );
    expect(screen.queryByText("45")).not.toBeInTheDocument();
    expect(onBundle).toHaveBeenCalledWith(null);
  });

  it("rejects a non-JSON file before reading it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onBundle = vi.fn();
    render(<ProofBundlePanel onBundle={onBundle} />);
    await user.upload(
      screen.getByLabelText("Choose proof bundle JSON"),
      new File(["private contents"], "proof.pdf", { type: "application/pdf" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Choose a JSON file for the local proof bundle.",
    );
    expect(screen.queryByText("private contents")).not.toBeInTheDocument();
    expect(onBundle).toHaveBeenCalledWith(null);
  });
});
