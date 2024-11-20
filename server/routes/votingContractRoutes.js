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
    console.log("Vote API called");
    const { candidateId } = req.body;

    try {
        const startTime = Date.now(); // Start the timer

        // Sending the transaction
        const tx = await contract.vote(candidateId, { from: wallet.address });
        const receipt = await tx.wait(); // Wait for the transaction to be mined

        const endTime = Date.now(); // End the timer
        const timeTaken = endTime - startTime; // Time taken in milliseconds

        // Fetch the block containing the transaction
        const block = await provider.getBlock(receipt.blockNumber);

        // Calculate block size
        const blockSize = Buffer.byteLength(JSON.stringify(block));

        // Send response
        res.json({
            gasUsed: receipt.gasUsed.toString(), // Gas used in the transaction
            blockSize, // Block size in bytes
            timeTaken, // Total time taken
        });
    } catch (error) {
        console.error(error); // Log the error details
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

router.get('/get-candidates-v2', async (req, res) => {
    try {
        const candidates = await contract.getAllCandidates();
        const formattedCandidates = candidates.map(candidate => ({
            id: candidate.id.toString(),
            name: candidate.name,
            voteCount: candidate.voteCount.toString(),
        }));
        console.log(formattedCandidates)
        res.json({ formattedCandidates });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
