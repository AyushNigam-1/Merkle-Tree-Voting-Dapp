const express = require('express');
const votingV1Routes = require("./routes/votingContractRoutes")
const votingV2Routes = require("./routes/merklevVotingContractRoutes")
const app = express();
const cors = require('cors');
const port = 3000;
app.use(cors());
app.use(express.json());

app.use('/voting', votingV1Routes);
app.use('/merklevoting', votingV2Routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
