const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.IMMUTABLE_ZKEVM_RPC_PROVIDER);
const wallet = new ethers.Wallet(process.env.IMMUTABLE_ZKEVM_PRIVATE_KEY, provider);

const contractAddress = '0xe94531e5705d3E34a4003f7cB04EE8C24D6Cc2E9';
const contract = new ethers.Contract(contractAddress, abi, wallet);
async function getBlockSize(blockNumber) {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) throw new Error(`Block ${blockNumber} not found`);

    let totalSize = 500 + (block.extraData.length / 2);

    for (let tx of block.transactions) {
        const txReceipt = await provider.getTransaction(tx.hash);
        totalSize += txReceipt.data.length / 2;
    }

    return totalSize;
}
router.post('/vote-v3', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const startTime = Date.now();
        const tx = await contract.vote(candidateId, { from: wallet.address });
        const receipt = await tx.wait();

        const voteCastLog = receipt.logs.find(log => log.fragment && log.fragment.name === "VoteCast");
        if (!voteCastLog) throw new Error("VoteCast event not found in logs.");

        const { args } = voteCastLog;
        const updatedCandidate = {
            id: args[0].toString(),
            name: args[1],
            voteCount: args[2].toString(),
        };

        const gasUsed = BigInt(receipt.gasUsed);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || await provider.getGasPrice();
        const transactionFee = ethers.formatUnits(gasUsed * gasPrice, "gwei"); // Convert to gwei

        const blockSize = await getBlockSize(receipt.blockNumber);
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000; // Convert to seconds

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: Number(transactionFee), // Now in gwei
            blockSize: (blockSize / 1024).toFixed(2), // Convert to KB
            timeTaken: timeTaken.toFixed(3), // Convert to seconds
            updatedCandidate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/candidates-with-votes', async (req, res) => {
    try {
        const [ids, names, voteCounts] = await contract.getAllCandidatesDetails();
        const candidatesWithVotes = ids.map((id, index) => ({
            id: id.toString(),
            name: names[index],
            voteCount: voteCounts[index].toString(),
        }));

        res.json({ candidates: candidatesWithVotes });
    } catch (error) {
        console.error("Error fetching candidates and votes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
