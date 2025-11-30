import { useState } from "react";
import "./AutomaticExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";

function AutomaticMode() {
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
          {/*<GraphToolbar onDeleteNodes={enableRemoveMode} />*/}
          <GraphPlayToolbar />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Automatic</h2>
      </div>
    </>
  );
}

export default AutomaticMode;