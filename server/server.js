const express = require('express');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { abi } = require("./artifacts/contracts/MerkleVoting.sol/MerkleVoting.json")
const app = express();
app.use(bodyParser.json());

let tree;
let leaves = [];


const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(privateKey, provider);
const contractAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
const contract = new ethers.Contract(contractAddress, abi, wallet);


app.post('/addVote', async (req, res) => {
    const { voter, candidateId } = req.body;


    const leaf = keccak256(ethers.utils.defaultAbiCoder.encode(['address', 'uint'], [voter, candidateId]));
    leaves.push(leaf);


    tree = new MerkleTree(leaves, keccak256, { sortPairs: true });


    const root = tree.getRoot().toString('hex');
    await contract.setMerkleRoot(root);

    res.send({ message: 'Vote added successfully', root });
});


app.post('/vote', async (req, res) => {
    const { voter, candidateId, proof } = req.body;


    const leaf = keccak256(ethers.utils.defaultAbiCoder.encode(['address', 'uint'], [voter, candidateId]));
    const validProof = MerkleProof.verify(proof, tree.getRoot(), leaf);

    if (validProof) {

        await contract.vote(candidateId, proof);
        res.send({ message: 'Vote casted successfully' });
    } else {
        res.status(400).send({ message: 'Invalid Merkle proof or vote' });
    }
});


app.get('/candidateVotes/:candidateId', async (req, res) => {
    const candidateId = req.params.candidateId;
    const votes = await contract.getCandidateVotes(candidateId);
    res.send({ candidateId, votes });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
