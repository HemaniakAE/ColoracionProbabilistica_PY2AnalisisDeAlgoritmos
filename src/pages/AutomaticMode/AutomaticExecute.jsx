import { useState, useRef } from "react";
import "./AutomaticExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";
import AlgorithmStatsPanel from "../../components/AlgorithmStatsPanel";

function AutomaticMode() {
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedColors, setSelectedColors] = useState(["blue", "green", "yellow"]);
  const graphCanvasRef = useRef(null);
  const graphPlayToolbarRef = useRef(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(null);

  const enableRemoveMode = () => {
    setRemoveMode(true);
  };

  const handleRotateAllColors = () => {
    if (graphCanvasRef.current && graphCanvasRef.current.rotateColors) {
      graphCanvasRef.current.rotateColors(selectedColors);
      console.log("✅ Colores rotados en todos los nodos");
    }
  };

  const handleSelectedColorsChange = (colors) => {
    setSelectedColors(colors);
    console.log("Colores seleccionados actualizados:", colors);
  };

  // Función para resetear todo
  const handleReset = () => {
    console.log("handleReset called");
    
    // Limpiar el canvas
    if (graphCanvasRef?.current && typeof graphCanvasRef.current.resetGraph === "function") {
      console.log("Calling resetGraph...");
      graphCanvasRef.current.resetGraph();
      console.log("resetGraph completed");
    }

    // Limpiar intentos en el toolbar
    if (graphPlayToolbarRef?.current && typeof graphPlayToolbarRef.current.clearAttempts === "function") {
      console.log("Calling clearAttempts...");
      graphPlayToolbarRef.current.clearAttempts();
      console.log("clearAttempts completed");
    }

    // Limpiar intentos en el estado padre
    console.log("Clearing attempts...");
    setAttempts([]);

    // Resetear índice seleccionado
    setSelectedAttemptIndex(null);

    // Resetear modo de eliminación
    setRemoveMode(false);
    
    console.log("handleReset completed");
  };

  return (
    <>
      <Header onReset={handleReset} />

      <div className="top-side">
        <div className="top-left">
          <GraphCanvas 
            ref={graphCanvasRef}
            removeMode={removeMode}
            setRemoveMode={setRemoveMode}
            disableOnConnect={true}
            selectedColors={selectedColors}
          />
          {/* Panel de estadísticas debajo del canvas */}
          <AlgorithmStatsPanel 
            attempts={attempts} 
            selectedAttemptIndex={selectedAttemptIndex}
          />
        </div>
        <div className="top-right">
          <GraphToolbar 
            onDeleteNodes={enableRemoveMode}
            removeMode={removeMode}
            onRotateColors={handleRotateAllColors}
            selectedColors={selectedColors}
          />
          <GraphPlayToolbar 
            ref={graphPlayToolbarRef}
            graphCanvasRef={graphCanvasRef}
            onAttemptsUpdate={setAttempts}
            onSelectedAttemptChange={setSelectedAttemptIndex}
            onSelectedColorsChange={handleSelectedColorsChange}
          />
        </div>
      </div>
    </>
  );
}

export default AutomaticMode;