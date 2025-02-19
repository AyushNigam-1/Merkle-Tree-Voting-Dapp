const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
const axios = require('axios')
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.IMMUTABLE_ZKEVM_RPC_PROVIDER);
const wallet = new ethers.Wallet(process.env.IMMUTABLE_ZKEVM_PRIVATE_KEY, provider);

const contractAddress = '0x2C2a4756a00647466c8Ef0C8a7c9884Be818448D';
const contract = new ethers.Contract(contractAddress, abi, wallet);

async function getBlockSize(blockNumber) {
    const block = await provider.send("eth_getBlockByNumber", [
        ethers.toQuantity(blockNumber),
        false,
    ]);

    if (!block) {
        console.log(`Block ${blockNumber} not found.`);
        throw new Error(`Block ${blockNumber} not found`);
    }

    return parseInt(block.size, 16) || "Unknown size";
}

router.post('/vote-v3', async (req, res) => {
    const { candidateId } = req.body;
    try {
        console.log(`Received vote request for candidate ID: ${candidateId}`);
        const startTime = performance.now();
        console.log("Sending transaction...");
        const tx = await contract.vote(candidateId);
        console.log(`Transaction sent: ${tx.hash}, waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000;
        console.log(`Transaction took ${timeTaken.toFixed(3)} seconds.`);

        const voteCastLog = receipt.logs.find(
            log => log.fragment && log.fragment.name === "VoteCast"
        );

        if (!voteCastLog) {
            console.log("VoteCast event not found in logs.");
            throw new Error("VoteCast event not found in logs.");
        }

        console.log("VoteCast event found, extracting candidate details...");
        const { args } = voteCastLog;
        const updatedCandidate = {
            id: args[0].toString(),
            name: args[1],
            voteCount: args[2].toString(),
        };
        console.log(`Vote recorded for ${updatedCandidate.name}, new vote count: ${updatedCandidate.voteCount}`);

        const gasUsed = BigInt(receipt.gasUsed);
        console.log(`Gas used: ${gasUsed.toString()}`);

        const feeData = await provider.getFeeData();
        const gasPrice = BigInt(feeData.gasPrice || await provider.getGasPrice());

        if (!gasPrice) {
            console.log("Unable to fetch gas price.");
            throw new Error("Unable to fetch gas price.");
        }

        console.log(`Gas price: ${gasPrice.toString()}`);

        const transactionFeeIMXWei = gasUsed * gasPrice;

        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=immutable-x&vs_currencies=usd");
        const imxToUsdRate = response.data["immutable-x"].usd;

        const transactionFeeIMX = Number(transactionFeeIMXWei) / 1e18;
        const transactionFeeUSD = transactionFeeIMX * imxToUsdRate;
        console.log(`Transaction fee in USD: ${transactionFeeUSD.toFixed(4)}`);

        const blockSize = await getBlockSize(receipt.blockNumber);
        console.log(`Block size: ${(blockSize / 1024).toFixed(2)} KB`);

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: transactionFeeUSD.toFixed(4),
            blockSize: Number((blockSize / 1024).toFixed(2)),
            timeTaken: Number(timeTaken.toFixed(3)),
            updatedCandidate
        });

    } catch (error) {
        console.error("Error during voting process:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/candidates-with-votes', async (req, res) => {
    try {
        console.log("Fetching candidates and their votes...");
        const [ids, names, voteCounts] = await contract.getAllCandidatesDetails();

        console.log("Candidates retrieved successfully.");
        const candidatesWithVotes = ids.map((id, index) => ({
            id: id.toString(),
            name: names[index],
            voteCount: voteCounts[index].toString(),
        }));

        console.log("Sending candidates data...");
        res.json({ candidates: candidatesWithVotes });

    } catch (error) {
        console.error("Error fetching candidates and votes:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
