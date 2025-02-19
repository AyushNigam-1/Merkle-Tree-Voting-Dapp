const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json");
const keccak = require('keccak');
const axios = require('axios');

require("dotenv").config();

const router = express();

const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
const contractAddress = "0x69A78592B1C0d6699eb30ea05A1b1e0420E5E468";
const contract = new ethers.Contract(contractAddress, abi, wallet);

let voters = [];
let merkleTree = new MerkleTree([], (value) => keccak("keccak256").update(value).digest());
let merkleRoot = merkleTree.getRoot().toString("hex");

async function getBlockSize(blockNumber) {
    const block = await provider.send("eth_getBlockByNumber", [ethers.toBeHex(blockNumber), false]);
    const blockSize = Number(block.size);
    console.log(`Block size: ${blockSize} bytes`);
    return blockSize;
}

router.post("/vote-v1", async (req, res) => {
    const { candidateId } = req.body;
    console.log(`Received vote request for candidate ID: ${candidateId}`);
    const startTime = performance.now();
    try {
        const voterAddress = ethers.getAddress(wallet.address);
        console.log(`Voter address: ${voterAddress}`);

        const leaf = `0x${keccak("keccak256").update(Buffer.from(voterAddress.slice(2), "hex")).digest("hex")}`;
        if (!voters.includes(voterAddress)) {
            voters.push(voterAddress);
            console.log("Updating Merkle tree with new voter");
            const leafNodes = voters.map(voter =>
                `0x${keccak("keccak256").update(Buffer.from(voter.slice(2), "hex")).digest("hex")}`
            );
            merkleTree = new MerkleTree(
                leafNodes.map(x => Buffer.from(x.slice(2), "hex")),
                hash => Buffer.from(keccak("keccak256").update(hash).digest()),
                { sortPairs: true }
            );
            merkleRoot = `0x${merkleTree.getRoot().toString("hex")}`;
            console.log(`New Merkle Root: ${merkleRoot}`);
        }
        const proof = merkleTree.getProof(Buffer.from(leaf.slice(2), "hex"));
        const merkleProof = proof.map(proof => `0x${proof.data.toString("hex")}`);

        console.log("Sending vote transaction...");
        const tx = await contract.vote(candidateId, merkleProof, merkleRoot);
        const receipt = await tx.wait();
        console.log(`Transaction successful. Block number: ${receipt.blockNumber}`);

        const endTime = performance.now();
        const timeTaken = (endTime - startTime) / 1000;

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

        console.log(`Vote recorded for candidate: ${updatedCandidate.name}`);

        const gasUsed = BigInt(receipt.gasUsed);
        const feeData = await provider.getFeeData();

        let gasPrice;
        if (receipt.effectiveGasPrice) {
            gasPrice = receipt.effectiveGasPrice;
        } else {
            gasPrice = feeData.gasPrice || await provider.getGasPrice();
        }
        const transactionFeeWei = gasUsed * gasPrice;

        const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const ethToUsdRate = response.data["ethereum"].usd;
        const transactionFeeETH = ethers.formatUnits(transactionFeeWei, "ether");
        const transactionFee = parseFloat(transactionFeeETH) * ethToUsdRate;

        console.log(`Transaction Fee: ${transactionFee.toFixed(4)} USD`);

        const blockSize = await getBlockSize(receipt.blockNumber);

        res.json({
            gasUsed: Number(receipt.gasUsed),
            transactionFee: transactionFee.toFixed(4),
            blockSize: Number((blockSize / 1024).toFixed(2)),
            timeTaken: Number(timeTaken.toFixed(3)),
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
        console.log("Fetching candidate votes...");
        const [ids, names, voteCounts] = await contract.getAllCandidatesDetails();

        const candidatesWithVotes = ids.map((id, index) => ({
            id: id.toString(),
            name: names[index],
            voteCount: voteCounts[index].toString(),
        }));

        console.log("Candidates fetched successfully.");
        res.json({ candidates: candidatesWithVotes });
    } catch (error) {
        console.error("Error fetching candidates and votes:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch candidates and their votes.",
        });
    }
});

module.exports = router;
