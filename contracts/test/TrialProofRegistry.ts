import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { policyDigest } from "@vitapod/shared";
import { network } from "hardhat";
import { decodeEventLog, encodeAbiParameters, getAddress, keccak256 } from "viem";
import { loadProofBundle } from "./helpers/loadProofBundle.js";

describe("TrialProofRegistry", async () => {
  const { viem, networkHelpers } = await network.create();
  const eligible = await loadProofBundle("eligible-proof.json");
  const eligibleSecond = await loadProofBundle("eligible-proof.second.json");
  const ineligible = await loadProofBundle("ineligible-proof.json");

  async function deployRegistry() {
    const [firstWallet, secondWallet] = await viem.getWalletClients();
    assert.ok(firstWallet);
    assert.ok(secondWallet);
    const verifier = await viem.deployContract("Halo2Verifier");
    const registry = await viem.deployContract("TrialProofRegistry", [verifier.address]);
    const publicClient = await viem.getPublicClient();
    return { firstWallet, secondWallet, registry, publicClient };
  }

  it("accepts a real eligible proof and emits only public receipt metadata", async () => {
    const { firstWallet, registry, publicClient } = await networkHelpers.loadFixture(deployRegistry);
    const expectedDigest = keccak256(
      encodeAbiParameters(
        [{ type: "bytes" }, { type: "uint256[]" }],
        [eligible.proof, eligible.instances],
      ),
    );

    const hash = await registry.write.submit!([eligible.proof, eligible.instances], {
      account: firstWallet.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const decoded = receipt.logs
      .filter((log) => log.address.toLowerCase() === registry.address.toLowerCase())
      .map((log) => decodeEventLog({ abi: registry.abi, data: log.data, topics: log.topics }));

    assert.equal(receipt.status, "success");
    assert.equal(decoded.length, 1);
    assert.equal(decoded[0]?.eventName, "ProofAccepted");
    assert.deepEqual(decoded[0]?.args, {
      submitter: getAddress(firstWallet.account.address),
      policyDigest: policyDigest(),
      proofDigest: expectedDigest,
    });
    assert.equal(await registry.read.usedProofs!([expectedDigest]), true);
    assert.equal(await registry.read.hasAccepted!([firstWallet.account.address]), true);
  });

  it("rejects a proof with one flipped byte", async () => {
    const { firstWallet, registry } = await networkHelpers.loadFixture(deployRegistry);
    const firstByte = eligible.proof.slice(2, 4);
    const mutated = `0x${firstByte === "00" ? "01" : "00"}${eligible.proof.slice(4)}` as const;

    await viem.assertions.revertWithCustomError(
      registry.write.submit!([mutated, eligible.instances], { account: firstWallet.account }),
      registry,
      "InvalidProof",
    );
  });

  it("rejects a valid ineligible proof before registry acceptance", async () => {
    const { firstWallet, registry } = await networkHelpers.loadFixture(deployRegistry);

    await viem.assertions.revertWithCustomError(
      registry.write.submit!([ineligible.proof, ineligible.instances], {
        account: firstWallet.account,
      }),
      registry,
      "NotEligible",
    );
  });

  it("rejects the same proof twice", async () => {
    const { firstWallet, secondWallet, registry } = await networkHelpers.loadFixture(deployRegistry);
    await registry.write.submit!([eligible.proof, eligible.instances], {
      account: firstWallet.account,
    });

    await viem.assertions.revertWithCustomError(
      registry.write.submit!([eligible.proof, eligible.instances], {
        account: secondWallet.account,
      }),
      registry,
      "ProofAlreadyUsed",
    );
  });

  it("rejects a second valid proof from the same wallet", async () => {
    const { firstWallet, registry } = await networkHelpers.loadFixture(deployRegistry);
    await registry.write.submit!([eligible.proof, eligible.instances], {
      account: firstWallet.account,
    });

    await viem.assertions.revertWithCustomError(
      registry.write.submit!([eligibleSecond.proof, eligibleSecond.instances], {
        account: firstWallet.account,
      }),
      registry,
      "WalletAlreadyAccepted",
    );
  });

  it("accepts a distinct eligible proof from a second wallet", async () => {
    const { firstWallet, secondWallet, registry } = await networkHelpers.loadFixture(deployRegistry);
    await registry.write.submit!([eligible.proof, eligible.instances], {
      account: firstWallet.account,
    });
    await registry.write.submit!([eligibleSecond.proof, eligibleSecond.instances], {
      account: secondWallet.account,
    });

    assert.equal(await registry.read.hasAccepted!([firstWallet.account.address]), true);
    assert.equal(await registry.read.hasAccepted!([secondWallet.account.address]), true);
  });

  it("keeps source fields and synthetic fixture values out of the registry surface", async () => {
    const source = await readFile(
      resolve(process.cwd(), "contracts/TrialProofRegistry.sol"),
      "utf8",
    );
    for (const privateName of ["ageYears", "hba1cPercent", "egfrMlMin1_73m2", "input_data"]) {
      assert.equal(source.includes(privateName), false);
    }
    for (const privateValue of ["45", "6.4", "92"]) {
      assert.equal(source.includes(privateValue), false);
    }

    const artifact = JSON.parse(
      await readFile(
        resolve(
          process.cwd(),
          "artifacts/contracts/TrialProofRegistry.sol/TrialProofRegistry.json",
        ),
        "utf8",
      ),
    ) as {
      abi: Array<{
        type: string;
        name?: string;
        inputs?: Array<{ name: string; indexed?: boolean }>;
      }>;
    };
    const event = artifact.abi.find(
      (entry) => entry.type === "event" && entry.name === "ProofAccepted",
    );
    assert.ok(event?.inputs);
    assert.deepEqual(event.inputs.map((input) => input.name), [
      "submitter",
      "policyDigest",
      "proofDigest",
    ]);
    assert.equal(event.inputs.every((input) => input.indexed), true);
  });
});
