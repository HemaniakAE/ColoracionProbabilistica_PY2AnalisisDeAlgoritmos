import { useState, useRef } from "react";
import "./ManualExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";

function ManualExecute() {
  const [removeMode, setRemoveMode] = useState(false);
  const graphCanvasRef = useRef(null);
  const graphPlayToolbarRef = useRef(null);

  const enableRemoveMode = () => {
    setRemoveMode(true);
  };

  const handleReset = () => {
    if (graphPlayToolbarRef.current) {
      graphPlayToolbarRef.current.clearAttempts();
    }
  };

  return (
    <>
      <Header />

      <div className="top-side">
        <div className="top-left">
          <GraphCanvas 
            ref={graphCanvasRef}
            removeMode={removeMode}
            setRemoveMode={setRemoveMode}
          />
        </div>
        <div className="top-right">
          <GraphToolbar onDeleteNodes={enableRemoveMode} />
          <GraphPlayToolbar 
            ref={graphPlayToolbarRef}
            graphCanvasRef={graphCanvasRef}
            onReset={handleReset}
          />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Manual</h2>
      </div>
    </>
  );
}

export default ManualExecute;