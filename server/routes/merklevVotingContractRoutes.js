const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(adminPrivateKey, provider);
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const contract = new ethers.Contract(contractAddress, abi, wallet);


router.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.originalUrl}`);
    next();
});


router.post('/add-candidate-v1', async (req, res) => {
    const { name } = req.body;
    try {
        const tx = await contract.addCandidate(name);
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.post('/vote-v1', async (req, res) => {
    const { candidateId, voterAddress } = req.body;
    try {
        const startTime = Date.now(); // Start the timer

        // Initiate the vote transaction
        const tx = await contract.vote(candidateId, { from: voterAddress });

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        const endTime = Date.now(); // End the timer
        const timeTaken = endTime - startTime; // Calculate time taken in milliseconds

        // Fetch the block details to get block size
        const block = await provider.getBlock(receipt.blockNumber);

        // Prepare and send response
        res.json({
            success: true,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(), // Gas used for the transaction
            blockSize: block.size, // Size of the block in bytes
            timeTaken: `${timeTaken} ms` // Time taken in milliseconds
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});



router.get('/get-winner-v1', async (req, res) => {
    try {
        const { winnerId, winnerName, winnerVoteCount } = await contract.getWinner();
        res.json({ winnerId, winnerName, winnerVoteCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/get-candidates-v1', async (req, res) => {
    try {
        const candidates = await contract.getAllCandidates();
        const formattedCandidates = candidates.map(candidate => ({
            id: candidate.id.toString(),
            name: candidate.name,
            voteCount: candidate.voteCount.toString(),
        }));

        res.json({ success: true, candidates: formattedCandidates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;
