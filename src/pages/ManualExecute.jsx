import { useState } from "react";
import "./ManualExecute.css";
import Header from "../components/Header";
import GraphCanvas from "../components/GraphCanvas";
import GraphToolbar from "../components/GraphToolBar";
import GraphPlayToolbar from "../components/GraphPlayToolbar";

function ManualExecute() {
  const [removeMode, setRemoveMode] = useState(false);

  const enableRemoveMode = () => {
    setRemoveMode(true);
  };

  return (
    <>
      <Header />

      <div className="top-side">
        <div className="top-left">
          <GraphCanvas 
            removeMode={removeMode}
            setRemoveMode={setRemoveMode}
          />
        </div>
        <div className="top-right">
          <GraphToolbar onDeleteNodes={enableRemoveMode} />
          <GraphPlayToolbar />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Bottom</h2>
      </div>
    </>
  );
}

export default ManualExecute;