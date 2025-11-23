import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import GraphCanvas from "./components/GraphCanvas";
import GraphToolbar from "./components/GraphToolBar";

function App() {
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
        </div>
      </div>

      <div className="bottom-side">
        <h2>Bottom</h2>
      </div>
    </>
  );
}

export default App;