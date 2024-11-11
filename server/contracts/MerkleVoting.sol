// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MerkleVoting {
    address public admin;
    bool public votingOpen;

    mapping(address => bool) public voters;
    bytes32 public merkleRoot;

    uint public candidatesCount;
    mapping(uint => string) public candidates;

    event CandidateAdded(uint candidateId, string name);
    event Voted(address voter, uint candidateId);
    event VotingStarted();
    event VotingEnded();
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    modifier votingActive() {
        require(votingOpen, "Voting is not currently open.");
        _;
    }

    constructor() {
        admin = msg.sender;
        votingOpen = false;
        candidatesCount = 0;
    }

    function addCandidate(string memory _name) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = _name;
        emit CandidateAdded(candidatesCount, _name);
    }

    function startVoting() public onlyAdmin {
        votingOpen = true;
        emit VotingStarted();
    }

    function endVoting() public onlyAdmin {
        votingOpen = false;
        emit VotingEnded();
    }

    function updateMerkleRoot(bytes32 _newMerkleRoot) public onlyAdmin {
        merkleRoot = _newMerkleRoot;
        emit MerkleRootUpdated(_newMerkleRoot);
    }

    // Function to verify the vote using a Merkle proof
    function vote(
        uint _candidateId,
        bytes32[] calldata proof
    ) public votingActive {
        require(!voters[msg.sender], "You have already voted.");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate ID."
        );

        // Rebuild the Merkle root from the proof and the vote
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _candidateId));
        bytes32 computedHash = leaf;
        for (uint i = 0; i < proof.length; i++) {
            computedHash = keccak256(abi.encodePacked(computedHash, proof[i]));
        }

        // Check if the computed hash matches the Merkle root
        require(computedHash == merkleRoot, "Invalid Merkle proof.");

        // Mark the voter as voted
        voters[msg.sender] = true;

        emit Voted(msg.sender, _candidateId);
    }

    // Function to get the Merkle root
    function getMerkleRoot() public view returns (bytes32) {
        return merkleRoot;
    }
}
