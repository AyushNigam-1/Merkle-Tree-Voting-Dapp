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
    const blockSize = Number(block.size); // Direct size in bytes
    return blockSize;
}

router.post('/vote-v2', async (req, res) => {

    const { candidateId } = req.body;
    try {
        const startTime = performance.now();
        const tx = await contract.vote(candidateId, { from: wallet.address });
        const receipt = await tx.wait();
        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000; // Convert ms to seconds
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

        let gasPrice;
        if (receipt.effectiveGasPrice) {
            gasPrice = receipt.effectiveGasPrice;
        } else {
            gasPrice = feeData.gasPrice || await provider.getGasPrice();
        }

        // Compute the actual transaction fee
        const transactionFeeWei = gasUsed * gasPrice;
        // const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether"); // Convert to ETH
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const ethToUsdRate = response.data["ethereum"].usd;

        // Convert transaction fee in Wei to ETH
        const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether");

        // Convert transaction fee in ETH to USD
        const transactionFee = parseFloat(transactionFeeETH) * ethToUsdRate;
        const blockSize = await getBlockSize(receipt.blockNumber);


        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: transactionFee.toFixed(4), // Also return in wei
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


