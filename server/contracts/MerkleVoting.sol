// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleVoting {
    address public admin;
    bytes32 public merkleRoot; // Root of the Merkle tree

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint[] public candidateIds;
    uint private nextCandidateId = 1; // Tracks the next candidate ID

    event Voted(address indexed voter, uint candidateId);
    event CandidateAdded(uint candidateId, string name);
    event MerkleRootUpdated(bytes32 merkleRoot);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    // Function to add a new candidate
    function addCandidate(string memory name) public onlyAdmin {
        candidates[nextCandidateId] = Candidate(nextCandidateId, name, 0);
        candidateIds.push(nextCandidateId);
        emit CandidateAdded(nextCandidateId, name);
        nextCandidateId++;
    }

    // Function to vote for a candidate using Merkle proof
    function vote(
        uint candidateId,
        bytes32[] calldata merkleProof,
        bytes32 newMerkleRoot
    ) public {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(candidates[candidateId].id != 0, "Candidate does not exist.");
        require(
            verifyMerkleProof(merkleProof, msg.sender, newMerkleRoot),
            "Invalid Merkle proof."
        );

        // Mark the voter as having voted and increase the candidate's vote count
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;

        // Update the Merkle root
        merkleRoot = newMerkleRoot;
        emit MerkleRootUpdated(newMerkleRoot);

        emit Voted(msg.sender, candidateId);
    }

    // Function to verify Merkle proof using the new Merkle root
    function verifyMerkleProof(
        bytes32[] calldata merkleProof,
        address voter,
        bytes32 newRoot
    ) internal pure returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(voter));
        return MerkleProof.verify(merkleProof, newRoot, leaf);
    }

    // Function to get the vote count for a candidate
    function getVoteCount(uint candidateId) public view returns (uint) {
        require(candidates[candidateId].id != 0, "Candidate does not exist.");
        return candidates[candidateId].voteCount;
    }

    // Function to get all candidate IDs
    function getCandidateIds() public view returns (uint[] memory) {
        return candidateIds;
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateIds.length);
        for (uint i = 0; i < candidateIds.length; i++) {
            allCandidates[i] = candidates[candidateIds[i]];
        }
        return allCandidates;
    }
}
