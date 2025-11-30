import { useState, useRef } from "react";
import "./AutomaticExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";

function AutomaticMode() {
  const [removeMode, setRemoveMode] = useState(false);
  const graphCanvasRef = useRef(null);

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
        </div>
        <div className="top-right">
          {/*<GraphToolbar onDeleteNodes={enableRemoveMode} />*/}
          <GraphPlayToolbar graphCanvasRef={graphCanvasRef} />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Automatic</h2>
      </div>
    </>
  );
}

export default AutomaticMode;