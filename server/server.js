const express = require('express');
const votingV1Routes = require("./routes/merklevVotingContractRoutes")
const votingV2Routes = require("./routes/votingContractRoutes")
const votingV3Routes = require("./routes/zkEvmVotingContractRoutes")
const app = express();
const cors = require('cors');
const port = 3000;
app.use(cors());
app.use(express.json());

app.use('/v1', votingV1Routes);
app.use('/v2', votingV2Routes);
app.use('/v3', votingV3Routes);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
