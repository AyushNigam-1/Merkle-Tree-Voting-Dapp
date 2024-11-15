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

    function vote(uint _candidateId) public {
        require(!voters[msg.sender].hasVoted, "You have already voted.");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate ID."
        );

        voters[msg.sender] = Voter(true, _candidateId);
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    function getWinner()
        public
        view
        returns (uint winnerId, string memory winnerName, uint winnerVoteCount)
    {
        uint maxVotes = 0;
        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = candidates[i].id;
                winnerName = candidates[i].name;
                winnerVoteCount = candidates[i].voteCount;
            }
        }
    }
}
