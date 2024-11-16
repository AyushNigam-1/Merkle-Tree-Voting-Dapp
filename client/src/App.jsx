import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [voterAddressv1, setVoterAddressv1] = useState("");
  const [candidateIdv1, setCandidateIdv1] = useState("");
  const [voterAddressv2, setVoterAddressv2] = useState("");
  const [candidateIdv2, setCandidateIdv2] = useState("");

  const getCandidates = async () => {
    const candidatesV1 = await axios.get("http://localhost:3000/merklevoting/get-candidates-v1")
    const candidatesV2 = await axios.get("http://localhost:3000/voting/get-candidates-v2")

    console.log(candidatesV1, candidatesV2)
  }
  useEffect(() => {
    getCandidates()
  }, [])
  const handleSubmitV1 = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/api/vote-v1", {
        voter: voterAddressv1,
        candidateId: candidateIdv1
      });
      console.log("Vote submitted:", response.data);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };
  const handleSubmitV2 = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/api/vote-v2", {
        voter: voterAddressv2,
      });
      console.log("Vote submitted:", response.data);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };
  return (
    <div style={{ height: "100vh", width: "100vw", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <form onSubmit={handleSubmitV1} style={{ display: 'flex', flexDirection: 'column', gap: '4px', }}>
        <h1>Vote for Your Candidate - V1 - Ordinary Contract</h1>
        <label>
          Voter Address:
          <input
            type="text"
            value={voterAddressv1}
            onChange={(e) => setVoterAddressv1(e.target.value)}
          />
        </label>
        <br />
        <label>
          Candidate ID:
          <input
            type="number"
            value={candidateIdv1}
            onChange={(e) => setCandidateIdv1(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Vote</button>
      </form>
      <form onSubmit={handleSubmitV2} style={{ display: 'flex', flexDirection: 'column', gap: '4px', }}>
        <h1>Vote for Your Candidate - V1 - Merkle Tree Contract</h1>
        <label>
          Voter Address:
          <input
            type="text"
            value={voterAddressv2}
            onChange={(e) => setVoterAddressv2(e.target.value)}
          />
        </label>
        <br />
        <label>
          Candidate ID:
          <input
            type="number"
            value={candidateIdv2}
            onChange={(e) => setCandidateIdv2(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Vote</button>
      </form>
    </div>
  );
};

export default App;
