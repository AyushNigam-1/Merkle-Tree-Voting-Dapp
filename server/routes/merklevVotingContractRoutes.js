const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")
const keccak = require('keccak');
const keccak256 = require("keccak256");
require("dotenv").config()


const router = express();

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
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
        const block = await provider.getBlock(receipt.blockNumber, false);
        const manualGasPrice = 12n * 10n ** 9n;
        const gasUsed = BigInt(receipt.gasUsed);
        const gasPrice = manualGasPrice;
        const transactionFee = gasUsed * gasPrice;
        const blockSize = estimateBlockSize(BigInt(block.gasUsed), block.extraData);
        const endTime = performance.now()
        const timeTaken = endTime - startTime
        res.json({
            gasUsed: gasUsed.toString(),
            transactionFee: Math.floor(Number(transactionFee.toString()) / Math.pow(10, Math.floor(Math.log10(Number(transactionFee.toString()))) - 6)),
            blockSize: Number(blockSize.toString()),
            timeTaken: Number(timeTaken.toPrecision(5)),
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