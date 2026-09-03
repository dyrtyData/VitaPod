import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentPath = resolve(process.cwd(), "src/components/LocalPod.tsx");

describe("LocalPod privacy boundary", () => {
  it("does not include network or browser persistence APIs", async () => {
    const source = await readFile(componentPath, "utf8");
    expect(source).not.toMatch(/\b(fetch|axios|XMLHttpRequest|sendBeacon)\b/);
    expect(source).not.toMatch(/\b(localStorage|sessionStorage|indexedDB)\b/);
  });
});
