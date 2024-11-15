const express = require('express');
const votingV1Routes = require("./routes/votingContractRoutes")
const votingV2Routes = require("./routes/merklevVotingContractRoutes")
const app = express();
const port = 3000;

app.use(express.json());

app.use('/voting', votingV1Routes);
app.use('/second-voting', votingV2Routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
