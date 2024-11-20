const express = require("express");
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const { abi } = require("../artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")
const keccak = require('keccak');  // Import the keccak module correctly
const keccak256 = require("keccak256");
// const abiCoder = new AbiCoder();
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
let merkleTree = new MerkleTree([], (value) => keccak("keccak256").update(value).digest());
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

const keecackHash = (data) => {
    return keccak('keccak256').update(data).digest('hex')
}

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


router.post("/vote-v1", async (req, res) => {
    const { candidateId } = req.body;

    try {
        const startTime = Date.now();
        // Step 1: Normalize the voter address (wallet address in checksum format)
        const voterAddress = ethers.getAddress(wallet.address); // Ensure checksum address

        // Step 2: Encode and hash using `keccak` library to create the leaf node
        const leaf = `0x${keccak("keccak256")
            .update(Buffer.from(voterAddress.slice(2), "hex")) // Properly slice and convert address
            .digest("hex")}`;

        // Step 3: Add voter to the list and rebuild Merkle tree if not already present
        if (!voters.includes(voterAddress)) {
            voters.push(voterAddress);

            // Generate leaf nodes for Merkle Tree from the voters array
            const leafNodes = voters.map(voter =>
                `0x${keccak("keccak256")
                    .update(Buffer.from(voter.slice(2), "hex")) // Generate leaf hash from address
                    .digest("hex")}`
            );

            // Build Merkle Tree using sorted pairs
            merkleTree = new MerkleTree(
                leafNodes.map(x => Buffer.from(x.slice(2), "hex")), // Convert hex strings back to buffers for Merkle Tree
                hash => Buffer.from(keccak("keccak256").update(hash).digest()), // Keccak hash function
                { sortPairs: true }
            );
            merkleRoot = `0x${merkleTree.getRoot().toString("hex")}`; // Merkle root as bytes32
        }

        // Step 4: Generate the Merkle proof for the current voter
        const proof = merkleTree.getProof(Buffer.from(leaf.slice(2), "hex"));
        const merkleProof = proof.map(proof => `0x${proof.data.toString("hex")}`); // Hex string array with 0x prefix

        // Step 5: Interact with the smart contract
        const tx = await contract.vote(candidateId, merkleProof, merkleRoot);

        // Wait for the transaction to be mined and get the receipt
        const receipt = await tx.wait();

        // Extract details from the transaction receipt
        const endTime = Date.now(); // End the timer
        const timeTaken = endTime - startTime; // Time taken in milliseconds

        // Fetch the block containing the transaction
        const block = await provider.getBlock(receipt.blockNumber);

        // Calculate block size
        const blockSize = Buffer.byteLength(JSON.stringify(block)); // Block size might not be available in the receipt, handle gracefully

        // Respond with success along with the details
        res.json({
            timeTaken,   // Time taken for transaction
            gasUsed: receipt.gasUsed.toString(),       // Gas used for the transaction
            blockSize,   // Block size (if available)
        });
    } catch (error) {
        console.error("Error during voting:", error);

        // Respond with error details for debugging purposes
        res.status(500).json({
            error: "Failed to cast vote.",
            details: error.message || error,
        });
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