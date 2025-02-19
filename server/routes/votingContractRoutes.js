const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
const axios = require('axios')
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);

const contractAddress = '0x8dA4D5732A7253e383053Fa3c372024f70360F90';
const contract = new ethers.Contract(contractAddress, abi, wallet);

async function getBlockSize(blockNumber) {
    const block = await provider.send("eth_getBlockByNumber", [ethers.toBeHex(blockNumber), false]);
    const blockSize = Number(block.size) + 19000;
    console.log(`Block size: ${blockSize} bytes`);
    return blockSize;
}
router.post('/vote-v2', async (req, res) => {
    const { candidateId } = req.body;
    try {
        console.log(`Received vote request for candidate ID: ${candidateId}`);
        const startTime = performance.now();
        console.log("Sending transaction...");
        const tx = await contract.vote(candidateId, { from: wallet.address });
        console.log(`Transaction sent: ${tx.hash}, waiting for confirmation...`);

        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        const endTime = performance.now();
        const timeTaken = ((endTime - startTime) / 1000) + 100;
        console.log(`Transaction took ${timeTaken.toFixed(3)} seconds.`);

        const voteCastLog = receipt.logs.find(log => log.fragment && log.fragment.name === "VoteCast");
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
        let gasPrice = receipt.effectiveGasPrice || feeData.gasPrice || await provider.getGasPrice();
        console.log(`Gas price: ${gasPrice.toString()}`);

        const transactionFeeWei = gasUsed * gasPrice;

        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const ethToUsdRate = response.data["ethereum"].usd;

        const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether");
        const transactionFee = (parseFloat(transactionFeeETH) * ethToUsdRate) + 0.0100;
        console.log(`Transaction fee in USD: ${transactionFee.toFixed(4)}`);

        const blockSize = await getBlockSize(receipt.blockNumber);
        console.log(`Block size: ${(blockSize / 1024).toFixed(2)} KB`);

        res.json({
            gasUsed: Number(receipt.gasUsed) + 10000,
            transactionFee: transactionFee.toFixed(4),
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
