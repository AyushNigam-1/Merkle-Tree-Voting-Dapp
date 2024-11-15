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
    function vote(uint candidateId, bytes32[] calldata merkleProof) public {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(candidates[candidateId].id != 0, "Candidate does not exist.");
        require(
            verifyMerkleProof(merkleProof, msg.sender),
            "Invalid Merkle proof."
        );

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;

        emit Voted(msg.sender, candidateId);
    }

    // Function to verify Merkle proof
    function verifyMerkleProof(
        bytes32[] calldata merkleProof,
        address voter
    ) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(voter));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
    }

    // Admin function to update the Merkle root
    function updateMerkleRoot(bytes32 newMerkleRoot) public onlyAdmin {
        merkleRoot = newMerkleRoot;
        emit MerkleRootUpdated(newMerkleRoot);
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
}
