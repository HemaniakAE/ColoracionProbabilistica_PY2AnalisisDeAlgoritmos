import { useState, useRef } from "react";
import "./ManualExecute.css";
import Header from "../../components/Header";
import GraphCanvas from "../../components/GraphCanvas";
import GraphToolbar from "../../components/GraphToolBar";
import GraphPlayToolbar from "../../components/GraphPlayToolbar";

function ManualExecute() {
  const [removeMode, setRemoveMode] = useState(false);
  const [selectedColors, setSelectedColors] = useState(["blue", "green", "yellow"]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const graphCanvasRef = useRef(null);
  const graphPlayToolbarRef = useRef(null);

  const toggleRemoveMode = () => {
    console.log(`Modo eliminación: ${removeMode ? "DESACTIVADO" : "ACTIVADO"}`);
    setRemoveMode(prev => !prev);
  };

  const handleResetGraph = () => {
    console.log("Reset Graph ejecutado - Limpiando pantalla del grafo");
    
    if (graphCanvasRef.current && graphCanvasRef.current.resetGraph) {
      graphCanvasRef.current.resetGraph();
      console.log("Grafo limpiado completamente");
    } else {
      console.warn("graphCanvasRef no tiene resetGraph");
    }
    
    if (removeMode) {
      setRemoveMode(false);
      console.log("✅ Modo eliminación desactivado");
    }
  };

  const handleResetAttempts = () => {
    console.log(" Reset Attempts ejecutado - Limpiando intentos");
    
    if (graphPlayToolbarRef.current && graphPlayToolbarRef.current.clearAttempts) {
      graphPlayToolbarRef.current.clearAttempts();
      console.log("Intentos limpiados");
    }
  };

  const handleAttemptsUpdate = (updatedAttempts) => {
    console.log("Intentos actualizados:", updatedAttempts.length);
  };

  const handleSelectedAttemptChange = (index) => {
    console.log("Intento seleccionado:", index);
  };

  const handleRotateAllColors = () => {
    if (!selectedNodeId) {
      alert("Selecciona un nodo primero haciendo clic en él");
      return;
    }

    if (graphCanvasRef.current && graphCanvasRef.current.rotateNodeColor) {
      graphCanvasRef.current.rotateNodeColor(selectedNodeId, selectedColors);
      console.log(`✅ Color rotado en nodo ${selectedNodeId}`);
    }
  };

  const handleSelectedColorsChange = (colors) => {
    setSelectedColors(colors);
    console.log("Colores seleccionados actualizados:", colors);
  };

  return (
    <>
      <Header onReset={handleResetGraph} />
      
      <div className="top-side">
        <div className="top-left">
          <GraphCanvas 
            ref={graphCanvasRef}
            removeMode={removeMode}
            disableOnConnect={removeMode}
            selectedColors={selectedColors}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />
        </div>
        <div className="top-right">
          <GraphToolbar 
            onDeleteNodes={toggleRemoveMode}
            removeMode={removeMode}
            onRotateColors={handleRotateAllColors}
            selectedColors={selectedColors}
            selectedNodeId={selectedNodeId}
          />
          <GraphPlayToolbar 
            ref={graphPlayToolbarRef}
            graphCanvasRef={graphCanvasRef}
            onAttemptsUpdate={handleAttemptsUpdate}
            onSelectedAttemptChange={handleSelectedAttemptChange}
            onReset={handleResetAttempts}
            onSelectedColorsChange={handleSelectedColorsChange}
          />
        </div>
      </div>

      <div className="bottom-side">
        <h2>Modo Manual</h2>
        {removeMode && (
          <div style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderLeft: '4px solid #e74c3c',
            color: '#e74c3c',
            padding: '12px',
            marginTop: '15px',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.9rem'
          }}>
            <strong>Modo Eliminación ACTIVADO</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Haz clic en cualquier nodo del grafo para eliminarlo.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default ManualExecute;