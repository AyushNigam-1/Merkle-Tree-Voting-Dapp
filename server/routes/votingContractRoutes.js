const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
const adminPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(adminPrivateKey, provider);

const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const contract = new ethers.Contract(contractAddress, abi, wallet);


router.use((req, res, next) => {
    console.log(`Request Method: ${req.method}, Request URL: ${req.originalUrl}`);
    next();
});

router.post('/add-candidate-v2', async (req, res) => {
    const { candidateId, name } = req.body;
    try {
        const tx = await contract.addCandidate(candidateId, name);
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.post('/vote-v2', async (req, res) => {
    const { candidateId, voterAddress } = req.body;
    try {
        const tx = await contract.vote(candidateId, { from: voterAddress });
        const receipt = await tx.wait();
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


router.get('/get-vote-count/:candidateId-v2', async (req, res) => {
    const candidateId = req.params.candidateId;
    try {
        const voteCount = await contract.getVoteCount(candidateId);
        res.json({ candidateId, voteCount });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
