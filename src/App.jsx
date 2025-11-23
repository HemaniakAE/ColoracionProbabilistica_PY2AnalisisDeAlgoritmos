import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import GraphCanvas from "./components/GraphCanvas";
import GraphToolbar from "./components/GraphToolBar";

let nodeId = 0;

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const addNode = (type = "default") => {
    const newNode = {
      id: `node-${nodeId++}`,
      type,
      position: { x: 150, y: 150 },
      data: { label: `Nodo ${nodeId}` },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  return (
    <>
      <Header />

      <div className="top-side">
        <div className="top-left">
          <GraphCanvas
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
        />
        </div>
        <div className="top-right">
         <GraphToolbar onAddNode={addNode} />
        </div>
      </div>

      <div className="card">
        {/*<GraphCanvas
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
        />
        <GraphToolbar onAddNode={addNode} />*/}
      </div>

      <div className="bottom-side">
        <h2>Bottom</h2>
      </div>
    </>
  );
}

export default App;
