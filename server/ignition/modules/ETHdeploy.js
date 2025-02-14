const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingV2", (m) => {
  const voting = m.contract("Voting");
  const merkleVoting = m.contract("MerkleVoting");
  m.call(voting, "addCandidate", ['Alice'])
  m.call(merkleVoting, "addCandidate", ['Bob'])
  return { voting, merkleVoting };
});
