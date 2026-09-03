import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootArgumentIndex = process.argv.indexOf("--root");
const root = resolve(rootArgumentIndex === -1 ? "." : process.argv[rootArgumentIndex + 1]);
const ignoredTrackedPaths = new Set(["prover/fixtures/eligible.json", "prover/fixtures/ineligible.json"]);
const fixtureTestPaths = ["apps/web/src/test/", "packages/shared/test/", "prover/tests/"];
const forbiddenPath = /(^|\/)(\.humanlayer|\.env|[^/]*witness[^/]*|pk\.key|deployments\/.*\.json)(\/|$)/i;
const secretPattern = /(?:DEPLOYER_PRIVATE_KEY|PRIVATE_KEY|API_KEY|SECRET|TOKEN)[ \t]*[:=][ \t]*["']?(?!["' \t]*(?:$|#))[A-Za-z0-9_./+=-]{8,}/im;
const fixtureRecordPattern = /["']?ageYears["']?\s*[:=]\s*45\D+["']?hba1cPercent["']?\s*[:=]\s*6\.4\D+["']?egfrMlMin1_73m2["']?\s*[:=]\s*92/i;

function trackedFiles() {
  const result = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Unable to list tracked files.");
  }
  return result.stdout.split("\0").filter(Boolean);
}

function scanFile(relativePath, violations) {
  const filePath = resolve(root, relativePath);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) return;

  const content = readFileSync(filePath, "utf8");
  if (secretPattern.test(content)) violations.push(`${relativePath}: possible secret assignment`);
  if (!fixtureTestPaths.some((path) => relativePath.startsWith(path)) && fixtureRecordPattern.test(content)) {
    violations.push(`${relativePath}: eligible fixture record leaked`);
  }
}

function filesUnder(relativeDirectory) {
  const directory = resolve(root, relativeDirectory);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = `${relativeDirectory}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

const violations = [];
for (const relativePath of trackedFiles()) {
  if (forbiddenPath.test(relativePath)) violations.push(`${relativePath}: forbidden tracked path`);
  if (!ignoredTrackedPaths.has(relativePath)) scanFile(relativePath, violations);
}

const dist = resolve(root, "apps/web/dist");
if (existsSync(dist)) {
  for (const relativePath of filesUnder("apps/web/dist")) scanFile(relativePath, violations);
}

if (violations.length > 0) {
  console.error("No-PHI release check failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("No-PHI release check passed: tracked files and web build contain no fixture record, secrets, or forbidden paths.");
}
