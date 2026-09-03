import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App.js";

const eligible = JSON.stringify({ kind: "vitapod.synthetic-lab.v1", ageYears: 45, hba1cPercent: 6.4, egfrMlMin1_73m2: 92 });
const ineligible = JSON.stringify({ kind: "vitapod.synthetic-lab.v1", ageYears: 45, hba1cPercent: 5.2, egfrMlMin1_73m2: 92 });
const proofBundle = JSON.stringify({
  format: "vitapod-proof-bundle.v1",
  policyId: "vitapod-demo-metabolic-v1",
  modelSha256: "ab".repeat(32),
  ezklVersion: "23.0.5",
  eligible: true,
  proof: "0x0102",
  instances: ["1"],
});

describe("App", () => {
  it("updates the local preview without calling network or storage APIs", async () => {
    const networkCall = vi.fn();
    const requestConstructor = vi.fn();
    vi.stubGlobal("fetch", networkCall);
    vi.stubGlobal("XMLHttpRequest", requestConstructor);
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Choose synthetic JSON");

    await user.upload(input, new File([eligible], "eligible.json", { type: "application/json" }));
    expect(await screen.findByText("eligible", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("vitapod-demo-metabolic-v1")).toBeInTheDocument();

    await user.upload(input, new File([ineligible], "ineligible.json", { type: "application/json" }));
    expect(await screen.findByText("ineligible", { selector: "strong" })).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText("Choose proof bundle JSON"),
      new File([proofBundle], "eligible-proof.json", { type: "application/json" }),
    );
    expect(await screen.findByText("public proof output")).toBeInTheDocument();
    expect(networkCall).not.toHaveBeenCalled();
    expect(requestConstructor).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
  });
});
