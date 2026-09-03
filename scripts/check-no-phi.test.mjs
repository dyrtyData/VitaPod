import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = mkdtempSync(join(tmpdir(), "vitapod-no-phi-"));
const scanner = new URL("./check-no-phi.mjs", import.meta.url).pathname;

try {
  writeFileSync(join(root, "README.md"), "safe release content\n");
  spawnSync("git", ["-C", root, "init", "--quiet"], { stdio: "inherit" });
  spawnSync("git", ["-C", root, "add", "README.md"], { stdio: "inherit" });

  const clean = spawnSync("node", [scanner, "--root", root], { encoding: "utf8" });
  if (clean.status !== 0) throw new Error(clean.stderr || "Scanner rejected clean content.");

  writeFileSync(
    join(root, "README.md"),
    '{"ageYears":45,"hba1cPercent":6.4,"egfrMlMin1_73m2":92}\n'
  );
  spawnSync("git", ["-C", root, "add", "README.md"], { stdio: "inherit" });

  const leaked = spawnSync("node", [scanner, "--root", root], { encoding: "utf8" });
  if (leaked.status === 0 || !leaked.stderr.includes("eligible fixture record leaked")) {
    throw new Error("Scanner did not reject a planted eligible fixture record.");
  }

  console.log("No-PHI scanner negative test passed.");
} finally {
  rmSync(root, { recursive: true, force: true });
}
