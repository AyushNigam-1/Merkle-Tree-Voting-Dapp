// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    address public admin;
    bool public votingOpen;

    // Structure to store candidate information
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Mapping to store candidates
    mapping(uint => Candidate) public candidates;
    // Mapping to track voters
    mapping(address => bool) public hasVoted;

    // List to store candidate IDs (for easier iteration)
    uint[] public candidateIds;

    // Events to log actions
    event Voted(address indexed voter, uint candidateId);
    event CandidateAdded(uint candidateId, string name);
    event VotingStatusChanged(bool isOpen);

    constructor() {
        admin = msg.sender;
        votingOpen = false;
    }

    // Modifier to restrict certain actions to the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    // Modifier to check if voting is active
    modifier votingActive() {
        require(votingOpen, "Voting is not currently open.");
        _;
    }

    // Admin function to start the voting process
    function startVoting() public onlyAdmin {
        votingOpen = true;
        emit VotingStatusChanged(votingOpen);
    }

    // Admin function to end the voting process
    function endVoting() public onlyAdmin {
        votingOpen = false;
        emit VotingStatusChanged(votingOpen);
    }

    // Admin function to add a new candidate
    function addCandidate(
        uint _candidateId,
        string memory _name
    ) public onlyAdmin {
        require(
            candidates[_candidateId].id == 0,
            "Candidate ID already exists."
        );
        candidates[_candidateId] = Candidate(_candidateId, _name, 0);
        candidateIds.push(_candidateId);
        emit CandidateAdded(_candidateId, _name);
    }

    // Function to vote for a candidate using Merkle proof
    function vote(
        uint _candidateId
    )
        public
        // bytes32[] calldata proof
        votingActive
    {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(candidates[_candidateId].id != 0, "Candidate does not exist.");

        // Verify the Merkle proof here (this assumes the backend provides the proof for validation)
        // The actual Merkle root should be provided by the backend to verify the vote.

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    // Function to get the number of votes a candidate has received
    function getVoteCount(uint _candidateId) public view returns (uint) {
        require(candidates[_candidateId].id != 0, "Candidate does not exist.");
        return candidates[_candidateId].voteCount;
    }

    // Function to get all candidate IDs (for UI purposes)
    function getCandidateIds() public view returns (uint[] memory) {
        return candidateIds;
    }
}
