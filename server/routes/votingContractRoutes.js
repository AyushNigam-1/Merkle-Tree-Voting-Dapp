const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const { abi } = require("../artifacts/contracts/Voting.sol/Voting.json")
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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
    const { candidateId } = req.body;
    try {
        const startTime = Date.now();
        const tx = await contract.vote(candidateId, { from: wallet.address });
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
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        const block = await provider.getBlock(receipt.blockNumber);
        const blockSize = Buffer.byteLength(JSON.stringify(block));
        res.json({
            gasUsed: receipt.gasUsed.toString(),
            blockSize,
            timeTaken,
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
