import React, { useEffect, useState } from "react";
import axios from "axios";
import Charts from "./components/Charts";
// Register the components in Chart.js

const App = () => {
  const [candidatev1, setCandidatev1] = useState("");
  const [candidatev2, setCandidatev2] = useState("");
  const [timetaken, setTimeTaken] = useState([])
  const [gasUsed, setGasUsed] = useState([])
  const [size, setSize] = useState([])
  const [loader, setLoader] = useState(false)
  const [loader2, setLoader2] = useState(false)
  const getCandidates = async () => {
    const candidatesV1 = await axios.get("http://localhost:3000/v1/candidate-votes")
    const candidatesV2 = await axios.get("http://localhost:3000/v2/candidates-with-votes")
    setCandidatev1(candidatesV1.data.candidates[0])
    setCandidatev2(candidatesV2.data.candidates[0])
    console.log(candidatesV1, candidatesV2)
  }

  useEffect(() => {
    getCandidates()
  }, [])

  const handleSubmitV1 = async (event) => {
    event.preventDefault();
    setLoader(true)
    try {
      const response = await axios.post("http://localhost:3000/v1/vote-v1", {
        candidateId: candidatev1.id
      });
      const estimates = response.data;
      setTimeTaken((prev) => [...prev, estimates.timeTaken])
      setGasUsed((prev) => [...prev, estimates.gasUsed])
      setSize((prev) => [...prev, estimates.blockSize])
      setCandidatev1(estimates.updatedCandidate)
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
    finally {
      setLoader(false)
    }
  };
  const handleSubmitV2 = async (event) => {
    event.preventDefault();
    setLoader2(true)
    try {
      const response = await axios.post("http://localhost:3000/v2/vote-v2", {
        candidateId: candidatev2.id
      });
      const estimates = response.data;
      setTimeTaken((prev) => [...prev, estimates.timeTaken])
      setGasUsed((prev) => [...prev, estimates.gasUsed])
      setSize((prev) => [...prev, estimates.blockSize])
      setCandidatev2(estimates.updatedCandidate)

    } catch (error) {
      console.error("Error submitting vote:", error);
    }
    finally {
      setLoader2(false)
    }
  };
  return (
    <div>
      <div style={{ height: "100vh", width: "100vw", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px' }}>
        <form onSubmit={handleSubmitV1} style={{ display: 'flex', flexDirection: 'column', gap: '4px', }}>
          <h1> Merkle Tree Voting</h1>
          <div style={{
            backgroundColor: "rgb(255 201 201)", borderRadius: "10px", display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '8px', gap: "10px"
          }}  >
            <h3 style={{ margin: '0px', fontSize: "24px" }}>{candidatev1.name}</h3>
            <h1 style={{ margin: '0px', fontSize: '56px' }}>{candidatev1.voteCount}</h1>
            <button type="submit" style={{
              backgroundColor: "#fff",
              color: "#333",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textAlign: "center",
              fontWeight: 'bolder',
              width: '100%'
            }} > {loader ? <img width="14" src="Half circle.gif" /> : "Vote"} </button>
          </div>
        </form>
        <form onSubmit={handleSubmitV2} style={{ display: 'flex', flexDirection: 'column', gap: '4px', }}>
          <h1>Ordinary Voting </h1>
          <div style={{
            backgroundColor: "rgb(255 201 201)", borderRadius: "10px", display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '8px', gap: "10px"
          }}  >
            <h3 style={{ margin: '0px', fontSize: "24px" }}>{candidatev2.name}</h3>
            <h1 style={{ margin: '0px', fontSize: '56px' }}>{candidatev2.voteCount}</h1>
            <button type="submit" style={{
              backgroundColor: "#fff",
              color: "#333",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textAlign: "center",
              fontWeight: 'bolder',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }} > {loader2 ? <img width="14" src="Half circle.gif" /> : "Vote"} </button>
          </div>
        </form>
      </div>
      <Charts gasUsed={gasUsed} timetaken={timetaken} blocksize={size} />
    </div>
  );
};

export default App;
