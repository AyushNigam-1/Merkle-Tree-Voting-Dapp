const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const contract = new ethers.Contract(contractAddress, abi, wallet);
function estimateBlockSize(gasUsed, extraDataHex) {
    const BYTES_PER_GAS_UNIT = 16n;
    const BLOCK_HEADER_SIZE = 500n;

    const transactionDataSize = gasUsed / BYTES_PER_GAS_UNIT;
    const extraDataSize = BigInt(extraDataHex.length / 2);
    const totalBlockSize = BLOCK_HEADER_SIZE + transactionDataSize + extraDataSize;

    return totalBlockSize;
}
router.post('/vote-v2', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const startTime = performance.now();
        const tx = await contract.vote(candidateId, { from: wallet.address });
        const receipt = await tx.wait();
        const voteCastLog = receipt.logs.find(
            log => log.fragment && log.fragment.name === "VoteCast"
        );
        if (!voteCastLog) {
            throw new Error("VoteCast event not found in logs.");
        }
        const { args } = voteCastLog;
        const updatedCandidate = {
            id: args[0].toString(),
            name: args[1],
            voteCount: args[2].toString(),
        };
        const block = await provider.getBlock(receipt.blockNumber);
        const manualGasPrice = 12n * 10n ** 9n;
        const gasUsed = BigInt(receipt.gasUsed);
        const gasPrice = manualGasPrice;
        const transactionFee = gasUsed * gasPrice;
        const blockSize = estimateBlockSize(BigInt(block.gasUsed), block.extraData);
        const endTime = performance.now();
        const timeTaken = endTime - startTime;
        res.json({
            gasUsed: gasUsed.toString(),
            transactionFee: transactionFee.toString(),
            blockSize: blockSize.toString(),
            timeTaken,
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
