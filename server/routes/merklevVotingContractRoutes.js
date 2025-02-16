const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json");
const keccak = require("keccak");
require("dotenv").config();

const router = express();
const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
const contractAddress = "0xCECaC210a75aB1c3d5e69d689ff094577ea0c93f";
const contract = new ethers.Contract(contractAddress, abi, wallet);

let voters = [];
let merkleTree = new MerkleTree([], (value) => keccak("keccak256").update(value).digest());
let merkleRoot = `0x${merkleTree.getRoot().toString("hex")}`;

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

router.post("/vote-v1", async (req, res) => {
    const { candidateId } = req.body;
    const startTime = Date.now();
    try {
        const voterAddress = wallet.address;
        const leaf = ethers.keccak256(voterAddress);

        if (!voters.includes(voterAddress)) {
            voters.push(voterAddress);
            merkleTree = new MerkleTree(
                voters.map(ethers.keccak256),
                ethers.keccak256,
                { sortPairs: true }
            );
            merkleRoot = `0x${merkleTree.getRoot().toString("hex")}`;
        }

        const proof = merkleTree.getProof(leaf).map(x => `0x${x.data.toString("hex")}`);
        const tx = await contract.vote(candidateId, proof, merkleRoot);
        const receipt = await tx.wait();

        const voteCastLog = receipt.logs.find(log => log.fragment?.name === "VoteCast");
        if (!voteCastLog) throw new Error("VoteCast event not found in logs.");

        const args = voteCastLog.args;
        if (!args || args.length < 3) throw new Error("VoteCast event arguments missing or invalid.");

        const updatedCandidate = {
            id: args[0]?.toString() || "N/A",
            name: args[1] || "Unknown",
            voteCount: args[2]?.toString() || "0",
        };

        const gasUsed = BigInt(receipt.gasUsed);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || await provider.getGasPrice();
        const transactionFee = ethers.formatUnits(gasUsed * gasPrice, "gwei");
        const blockSize = await getBlockSize(receipt.blockNumber);
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: Number(transactionFee),
            blockSize: (blockSize / 1024).toFixed(2),
            timeTaken: timeTaken.toFixed(3),
            updatedCandidate
        });
    } catch (error) {
        console.error("Error during voting:", error);
        res.status(500).json({ error: "Failed to cast vote.", details: error.message || error });
    }
});

router.get("/candidate-votes", async (req, res) => {
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
        res.status(500).json({ success: false, error: "Failed to fetch candidates and their votes." });
    }
});

module.exports = router;
