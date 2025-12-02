import { useState, useRef } from "react";
import "./AutomaticExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";
import AlgorithmStatsPanel from "../../components/AlgorithmStatsPanel";

function AutomaticMode() {
  const [removeMode, setRemoveMode] = useState(false);
  const graphCanvasRef = useRef(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(null);

  const enableRemoveMode = () => {
    setRemoveMode(true);
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
            disableOnConnect={true}
          />
          {/* Panel de estadísticas debajo del canvas */}
          <AlgorithmStatsPanel 
            attempts={attempts} 
            selectedAttemptIndex={selectedAttemptIndex}
          />
        </div>
        <div className="top-right">
          {/*<GraphToolbar onDeleteNodes={enableRemoveMode} />*/}
          <GraphPlayToolbar 
            graphCanvasRef={graphCanvasRef}
            onAttemptsUpdate={setAttempts}
            onSelectedAttemptChange={setSelectedAttemptIndex}
          />
        </div>
      </div>
    </>
  );
}

export default AutomaticMode;