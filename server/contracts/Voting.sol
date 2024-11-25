// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        bool hasVoted;
        uint candidateId;
    }

    address public admin;

    mapping(address => Voter) public voters;
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;

    event CandidateAdded(uint candidateId, string name);
    event Voted(address voter, uint candidateId);
    event VoteCast(uint candidateId, string name, uint voteCount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addCandidate(string memory _name) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }

    function vote(uint candidateId) public {
        // require(!voters[msg.sender].hasVoted, "You have already voted.");
        require(
            candidateId > 0 && candidateId <= candidatesCount,
            "Invalid candidate ID."
        );

        voters[msg.sender] = Voter(true, candidateId);
        candidates[candidateId].voteCount++;

        emit VoteCast(
            candidateId,
            candidates[candidateId].name,
            candidates[candidateId].voteCount
        );
    }

    function getAllCandidatesDetails()
        public
        view
        returns (uint[] memory, string[] memory, uint[] memory)
    {
        uint[] memory ids = new uint[](candidatesCount);
        string[] memory names = new string[](candidatesCount);
        uint[] memory voteCounts = new uint[](candidatesCount);

        for (uint i = 1; i <= candidatesCount; i++) {
            ids[i - 1] = candidates[i].id;
            names[i - 1] = candidates[i].name;
            voteCounts[i - 1] = candidates[i].voteCount;
        }

        return (ids, names, voteCounts);
    }
}
