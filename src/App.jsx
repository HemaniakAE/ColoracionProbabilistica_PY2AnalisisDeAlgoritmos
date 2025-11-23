import { useState, useCallback } from "react";
import "./App.css";
import Header from "./components/Header";
import GraphCanvas from "./components/GraphCanvas";
import GraphToolbar from "./components/GraphToolBar";

let nodeId = 0;

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [removeMode, setRemoveMode] = useState(false); // modo eliminar

  const addNode = useCallback(() => {
    const newNode = {
      id: `node-${nodeId++}`,
      type: "circle",
      position: { x: 150 + Math.random() * 200, y: 150 + Math.random() * 200 },
      data: { label: `Nodo ${nodeId}` },
    };
    setNodes((prev) => [...prev, newNode]);
  }, []);

  const enableRemoveMode = () => {
    setRemoveMode(true); // activa modo eliminar
  };

  const handleNodeClick = (nodeIdClicked) => {
    if (removeMode) {
      // eliminar nodo clickeado
      setNodes((nds) => nds.filter((n) => n.id !== nodeIdClicked));
      setEdges((eds) =>
        eds.filter(
          (e) => e.source !== nodeIdClicked && e.target !== nodeIdClicked
        )
      );
      setRemoveMode(false); // desactivar modo eliminar
    }
  };

  const handlePaneClick = () => {
    if (removeMode) {
      setRemoveMode(false); // click en canvas vacío desactiva modo
    }
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
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
          />
        </div>
        <div className="top-right">
          <GraphToolbar onAddNode={addNode} onDeleteNodes={enableRemoveMode} />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Bottom</h2>
      </div>
    </>
  );
}

export default App;
