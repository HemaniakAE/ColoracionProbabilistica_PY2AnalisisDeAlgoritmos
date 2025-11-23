import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import GraphCanvas from "./components/GraphCanvas";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Header />

      <div className="top-side">
        <h2>Top</h2>
      </div>

      <div className="card">
        <GraphCanvas />
      </div>

      <div className="bottom-side">
        <h2>Bottom</h2>
      </div>
    </>
  );
}

export default App;
