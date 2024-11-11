const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// Example data: Voter addresses and the candidate ID they voted for
const votes = [
    { voter: "0xabc...", candidateId: 1 },
    { voter: "0xdef...", candidateId: 2 },
    { voter: "0x123...", candidateId: 3 }
];

// Generate Merkle tree leaves (hash of voter address + candidate ID)
const leaves = votes.map(vote => keccak256(ethers.utils.defaultAbiCoder.encode(["address", "uint"], [vote.voter, vote.candidateId])));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// Get the root of the Merkle tree
const root = tree.getRoot();
console.log("Merkle Root:", root.toString('hex'));

// Now, for each voter, we need to create a Merkle proof
votes.forEach((vote, index) => {
    const leaf = leaves[index];
    const proof = tree.getProof(leaf).map(p => p.data.toString('hex'));
    console.log(`Proof for voter ${vote.voter}:`, proof);
});
