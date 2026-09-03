// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Halo2Verifier} from "./generated/Halo2Verifier.sol";

contract TrialProofRegistry {
    Halo2Verifier public immutable verifier;
    bytes32 public immutable policyDigest;

    mapping(bytes32 => bool) public usedProofs;
    mapping(address => bool) public hasAccepted;

    event ProofAccepted(
        address indexed submitter,
        bytes32 indexed policyDigest,
        bytes32 indexed proofDigest
    );

    error InvalidProof();
    error NotEligible();
    error ProofAlreadyUsed();
    error WalletAlreadyAccepted();

    constructor(address verifierAddress) {
        verifier = Halo2Verifier(verifierAddress);
        policyDigest = keccak256(bytes("vitapod-demo-metabolic-v1"));
    }

    function submit(bytes calldata proof, uint256[] calldata instances) external {
        if (instances.length != 1 || instances[0] != 1) revert NotEligible();

        bool valid;
        try verifier.verifyProof(proof, instances) returns (bool result) {
            valid = result;
        } catch {
            revert InvalidProof();
        }
        if (!valid) revert InvalidProof();

        bytes32 proofDigest = keccak256(abi.encode(proof, instances));
        if (usedProofs[proofDigest]) revert ProofAlreadyUsed();
        if (hasAccepted[msg.sender]) revert WalletAlreadyAccepted();

        usedProofs[proofDigest] = true;
        hasAccepted[msg.sender] = true;
        emit ProofAccepted(msg.sender, policyDigest, proofDigest);
    }
}
