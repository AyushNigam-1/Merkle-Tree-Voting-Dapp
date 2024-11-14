// app.js

const express = require('express');
const votingContractRoutes = require('./routes/votingContractRoutes');
const secondVotingContractRoutes = require('./routes/secondVotingContractRoutes');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON requests

// Mount the route files
app.use('/voting', votingContractRoutes);
app.use('/second-voting', secondVotingContractRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
