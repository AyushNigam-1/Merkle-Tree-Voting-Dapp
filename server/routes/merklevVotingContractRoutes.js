const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { keccak256, defaultAbiCoder } = ethers;
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")

// Set up Express router
const router = express();
// Ethers setup (change to your provider URL, like Infura, Alchemy, or local Ganache)
const provider = new ethers.JsonRpcProvider("http://localhost:8545"); // Change to your provider
const adminPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Admin private key to sign transactions
const wallet = new ethers.Wallet(adminPrivateKey, provider);

// Contract setup
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";  // Deployed contract address
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Middleware

// In-memory storage for simplicity (you could use a database here)
let voters = []; // List of voters (for Merkle tree)
let candidates = []; // List of candidates for Merkle tree

// Merkle Tree Setup
let merkleTree = new MerkleTree([], keccak256);
let merkleRoot = merkleTree.getRoot().toString("hex");

const adminAddress = wallet.address; // Admin address

// Fetch current Merkle root
router.get("/merkle-root", (req, res) => {
    res.json({ merkleRoot });
});

// Add a candidate (admin only)
router.post("/add-candidate", async (req, res) => {
    const { name } = req.body;

    if (req.body.admin !== adminAddress) {
        return res.status(403).json({ error: "Only admin can add candidates." });
    }

    try {
        // Interact with the contract to add a candidate
        const tx = await contract.addCandidate(name);
        await tx.wait(); // Wait for the transaction to be mined

        candidates.push(name); // Add to our local list for Merkle Tree
        voters.push(name); // Adding candidate to voters list for proof
        merkleTree = new MerkleTree(voters.map(voter => keccak256(voter)), keccak256);
        merkleRoot = merkleTree.getRoot().toString("hex");

        res.json({ message: `Candidate '${name}' added successfully.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add candidate." });
    }
});

// Update the Merkle root (admin only)
router.post("/update-merkle-root", async (req, res) => {
    const { newMerkleRoot, admin } = req.body;

    if (admin !== adminAddress) {
        return res.status(403).json({ error: "Only admin can update Merkle root." });
    }

    try {
        // Update the contract's Merkle root
        const tx = await contract.updateMerkleRoot(newMerkleRoot);
        await tx.wait(); // Wait for the transaction to be mined

        merkleRoot = newMerkleRoot; // Update local Merkle root
        res.json({ message: "Merkle root updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update Merkle root." });
    }
});

// Cast a vote (with Merkle proof)

router.post("/vote-v1", async (req, res) => {
    const { candidateId, voter, merkleProof } = req.body;

    try {
        // Verify Merkle proof off-chain using keccak256
        const leaf = keccak256(defaultAbiCoder(["address"], [voter]));  // Encode voter address
        const isValidProof = merkleTree.verify(merkleProof, leaf, merkleRoot);

        if (!isValidProof) {
            return res.status(400).json({ error: "Invalid Merkle proof." });
        }

        // Interact with the contract to vote for the candidate
        const tx = await contract.vote(candidateId, merkleProof);
        await tx.wait(); // Wait for the transaction to be mined

        res.json({ message: `Vote casted successfully for candidate ${candidateId}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to cast vote." });
    }
});


// Fetch candidate vote counts
router.get("/candidate-votes/:candidateId", async (req, res) => {
    const { candidateId } = req.params;

    try {
        const voteCount = await contract.getVoteCount(candidateId);
        res.json({ candidateId, voteCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get vote count." });
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
        console.log(formattedCandidates)
        res.json({ formattedCandidates });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router