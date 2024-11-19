import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [voterAddressv1, setVoterAddressv1] = useState("");
  const [candidateIdv1, setCandidateIdv1] = useState("");
  const [voterAddressv2, setVoterAddressv2] = useState("");
  const [candidateIdv2, setCandidateIdv2] = useState("");

  const getCandidates = async () => {
    const candidatesV1 = await axios.get("http://localhost:3000/v1/get-candidates-v1")
    const candidatesV2 = await axios.get("http://localhost:3000/v2/get-candidates-v2")
    setCandidateIdv1(candidatesV1.data.formattedCandidates[0].id)
    setCandidateIdv2(candidatesV2.data.formattedCandidates[0].id)
  }
  useEffect(() => {
    getCandidates()
  }, [])
  const handleSubmitV1 = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/v1/vote-v1", {
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
      const response = await axios.post("http://localhost:3000/v2/vote-v2", {
        candidateId: candidateIdv2
      });
      console.log("Vote submitted:", response.data);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };
  return (
    <div style={{ height: "100vh", width: "100vw", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <form onSubmit={handleSubmitV1} style={{ display: 'flex', flexDirection: 'column', gap: '4px', }}>
        <h1>Vote for Your Candidate - V1 - Merkle Tree Contract</h1>
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
        <h1>Vote for Your Candidate - V2 - Ordinary Contract </h1>
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
