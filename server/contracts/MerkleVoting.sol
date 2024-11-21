// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleVoting {
    address public admin;
    bytes32 public merkleRoot;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    uint[] public candidateIds;
    uint private nextCandidateId = 1;

    event Voted(address indexed voter, uint candidateId);
    event CandidateAdded(uint candidateId, string name);
    event MerkleRootUpdated(bytes32 merkleRoot);
    event VoteCast(uint candidateId, string name, uint voteCount);

    event DebugMerkleProof(
        bytes32 leaf,
        bytes32[] merkleProof,
        bytes32 newRoot,
        bool isValidProof
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    function addCandidate(string memory name) public onlyAdmin {
        candidates[nextCandidateId] = Candidate(nextCandidateId, name, 0);
        candidateIds.push(nextCandidateId);
        emit CandidateAdded(nextCandidateId, name);
        nextCandidateId++;
    }

    function vote(
        uint candidateId,
        bytes32[] calldata merkleProof,
        bytes32 newMerkleRoot
    ) public {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(candidates[candidateId].id != 0, "Candidate does not exist.");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bool isValidProof = MerkleProof.verify(
            merkleProof,
            newMerkleRoot,
            leaf
        );
        require(isValidProof, "Invalid Merkle proof.");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;

        merkleRoot = newMerkleRoot;
        emit VoteCast(
            candidateId,
            candidates[candidateId].name,
            candidates[candidateId].voteCount
        );
    }

    function verifyMerkleProof(
        bytes32[] calldata merkleProof,
        address voter,
        bytes32 newRoot
    ) internal pure returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(voter));
        return MerkleProof.verify(merkleProof, newRoot, leaf);
    }

    function getAllCandidatesDetails()
        public
        view
        returns (uint[] memory, string[] memory, uint[] memory)
    {
        uint[] memory ids = new uint[](candidateIds.length);
        string[] memory names = new string[](candidateIds.length);
        uint[] memory voteCounts = new uint[](candidateIds.length);

        for (uint i = 0; i < candidateIds.length; i++) {
            ids[i] = candidates[candidateIds[i]].id;
            names[i] = candidates[candidateIds[i]].name;
            voteCounts[i] = candidates[candidateIds[i]].voteCount;
        }

        return (ids, names, voteCounts);
    }
}
