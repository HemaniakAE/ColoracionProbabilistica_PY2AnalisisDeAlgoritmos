import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import GraphCanvas from "./components/GraphCanvas";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Header />
      <div className="card">
        <GraphCanvas />
      </div>
    </>
  );
}

export default App;
