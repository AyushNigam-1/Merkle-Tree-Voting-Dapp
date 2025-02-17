const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")
const keccak = require('keccak');
const axios = require('axios')

require("dotenv").config()


const router = express();

const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
const contractAddress = "0x6858763aCf4F344c38aDBb506A65eF509799b420";
const contract = new ethers.Contract(contractAddress, abi, wallet);

let voters = [];
let merkleTree = new MerkleTree([], (value) => keccak("keccak256").update(value).digest());
let merkleRoot = merkleTree.getRoot().toString("hex");
function estimateBlockSize(gasUsed, extraDataHex) {
    const BYTES_PER_GAS_UNIT = 16n;
    const BLOCK_HEADER_SIZE = 500n;

    const transactionDataSize = gasUsed / BYTES_PER_GAS_UNIT;
    const extraDataSize = BigInt(extraDataHex.length / 2);
    const totalBlockSize = BLOCK_HEADER_SIZE + transactionDataSize + extraDataSize;

    return totalBlockSize;
}

async function getBlockSize(blockNumber) {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) throw new Error(`Block ${blockNumber} not found`);

    let totalSize = 500 + (block.extraData.length / 2); // Base size + extra data

    for (let tx of block.transactions) {
        const txReceipt = await provider.getTransaction(tx);
        totalSize += txReceipt.data.length / 2; // Convert hex to bytes
    }

    return totalSize;
}

router.post("/vote-v1", async (req, res) => {
    const { candidateId } = req.body;
    const startTime = performance.now();
    try {
        const voterAddress = ethers.getAddress(wallet.address);
        const leaf = `0x${keccak("keccak256")
            .update(Buffer.from(voterAddress.slice(2), "hex"))
            .digest("hex")}`;
        if (!voters.includes(voterAddress)) {
            voters.push(voterAddress);
            const leafNodes = voters.map(voter =>
                `0x${keccak("keccak256")
                    .update(Buffer.from(voter.slice(2), "hex"))
                    .digest("hex")}`
            );
            merkleTree = new MerkleTree(
                leafNodes.map(x => Buffer.from(x.slice(2), "hex")),
                hash => Buffer.from(keccak("keccak256").update(hash).digest()),
                { sortPairs: true }
            );
            merkleRoot = `0x${merkleTree.getRoot().toString("hex")}`;
        }
        const proof = merkleTree.getProof(Buffer.from(leaf.slice(2), "hex"));
        const merkleProof = proof.map(proof => `0x${proof.data.toString("hex")}`);
        const tx = await contract.vote(candidateId, merkleProof, merkleRoot);
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
        const gasPrice = feeData.gasPrice || await provider.getGasPrice();
        const transactionFeeWei = gasUsed * gasPrice;
        // const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether"); // Convert to ETH
        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const ethToUsdRate = response.data["ethereum"].usd;

        // Convert transaction fee in Wei to ETH
        const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether");

        // Convert transaction fee in ETH to USD
        const transactionFee = parseFloat(transactionFeeETH) * ethToUsdRate;
        console.log(transactionFee)
        const blockSize = await getBlockSize(receipt.blockNumber);
        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000; // Convert ms to seconds

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: transactionFee.toFixed(4), // Also return in wei
            blockSize: Number((blockSize / 1024).toFixed(2)), // Convert to KB
            timeTaken: Number(timeTaken.toFixed(3)), // Time in seconds
            updatedCandidate
        });
    } catch (error) {
        console.error("Error during voting:", error);
        res.status(500).json({
            error: "Failed to cast vote.",
            details: error.message || error,
        });
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
        res.status(500).json({
            success: false,
            error: "Failed to fetch candidates and their votes.",
        });
    }
});





module.exports = router