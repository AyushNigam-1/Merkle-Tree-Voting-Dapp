const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingV3", (m) => {
    const ZKEVMvoting = m.contract("Voting");
    m.call(ZKEVMvoting, "addCandidate", ['John'])
    return { ZKEVMvoting };
});