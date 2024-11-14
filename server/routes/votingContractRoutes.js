// routes/votingContractRoutes.js

const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Ethereum provider and contract setup
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
const adminPrivateKey = '0xYourPrivateKey';
const wallet = new ethers.Wallet(adminPrivateKey, provider);

const contractABI = [
    // ABI from your Voting contract
];
const contractAddress = '0xYourContractAddress';  // Replace with your contract address
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Middleware for logging
router.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.originalUrl}`);
    next();
});

// Route to start voting
router.post('/start-voting', async (req, res) => {
    try {
        const tx = await contract.startVoting();
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to end voting
router.post('/end-voting', async (req, res) => {
    try {
        const tx = await contract.endVoting();
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to add candidate
router.post('/add-candidate', async (req, res) => {
    const { candidateId, name } = req.body;
    try {
        const tx = await contract.addCandidate(candidateId, name);
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to vote for a candidate
router.post('/vote', async (req, res) => {
    const { candidateId, voterAddress } = req.body;
    try {
        const tx = await contract.vote(candidateId, { from: voterAddress });
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to get vote count for a candidate
router.get('/get-vote-count/:candidateId', async (req, res) => {
    const candidateId = req.params.candidateId;
    try {
        const voteCount = await contract.getVoteCount(candidateId);
        res.json({ candidateId, voteCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
