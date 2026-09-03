import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentPaths = [
  resolve(process.cwd(), "src/components/LocalPod.tsx"),
  resolve(process.cwd(), "src/components/ProofBundlePanel.tsx"),
];

describe("local file privacy boundary", () => {
  it.each(componentPaths)("%s does not include network or browser persistence APIs", async (path) => {
    const source = await readFile(path, "utf8");
    expect(source).not.toMatch(/\b(fetch|axios|XMLHttpRequest|sendBeacon)\b/);
    expect(source).not.toMatch(/\b(localStorage|sessionStorage|indexedDB)\b/);
  });
});
