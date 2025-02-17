const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
const axios = require('axios')
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.IMMUTABLE_ZKEVM_RPC_PROVIDER);
const wallet = new ethers.Wallet(process.env.IMMUTABLE_ZKEVM_PRIVATE_KEY, provider);

const contractAddress = '0xC5Fc3DCCcAf6caaD1602717F46a7E7086921dC33';
const contract = new ethers.Contract(contractAddress, abi, wallet);

async function getBlockSize(blockNumber) {
    const block = await provider.send("eth_getBlockByNumber", [
        ethers.toQuantity(blockNumber),
        false,
    ]);

    if (!block) throw new Error(`Block ${blockNumber} not found`);

    return parseInt(block.size, 16) || "Unknown size";
}
router.post('/vote-v3', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const startTime = performance.now();
        const tx = await contract.vote(candidateId);
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

        const gasUsed = BigInt(receipt.gasUsed);
        const feeData = await provider.getFeeData();
        let gasPrice = feeData.gasPrice || await provider.getGasPrice();

        // Ensure gasPrice is in Wei
        if (gasPrice) {
            gasPrice = ethers.BigNumber.from(gasPrice).mul(ethers.BigNumber.from("1000000000")); // Convert Gwei to Wei
        } else {
            throw new Error("Unable to fetch gas price.");
        }

        const transactionFeeIMX = gasUsed * gasPrice;

        // Fetch IMX to USD rate
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=immutable-x&vs_currencies=usd");
        const imxToUsdRate = response.data["immutable-x"].usd;

        // Convert transaction fee in IMX to USD
        const transactionFee = Number(transactionFeeIMX) * imxToUsdRate;

        const blockSize = await getBlockSize(receipt.blockNumber);
        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000;

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: transactionFee.toFixed(4), // Fee in wei // Fee in IMX
            blockSize: Number((blockSize / 1024).toFixed(2)), // Convert to KB
            timeTaken: Number(timeTaken.toFixed(3)), // Time in seconds
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