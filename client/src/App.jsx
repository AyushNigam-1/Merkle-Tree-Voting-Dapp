import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [voterAddress, setVoterAddress] = useState("");
  const [candidateId, setCandidateId] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/api/vote", {
        voter: voterAddress,
        candidateId: candidateId
      });
      console.log("Vote submitted:", response.data);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  return (
    <div >
      <h1>Vote for Your Candidate</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Voter Address:
          <input
            type="text"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
          />
        </label>
        <br />
        <label>
          Candidate ID:
          <input
            type="number"
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Vote</button>
      </form>
    </div>
  );
};

export default App;
