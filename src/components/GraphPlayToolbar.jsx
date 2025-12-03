import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import "./GraphPlayToolbar.css";
import { FaPlay } from "react-icons/fa";
import { generateUniformGridGraph } from "../algorithms/graphGenerator";
import { ColoringAlgorithmManager } from "../algorithms";

const manager = new ColoringAlgorithmManager();

// Colores reales que se verán en el nodo
const COLOR_MAP = {
  blue: "#3498db",
  green: "#2ecc71",
  yellow: "#f1c40f",
  purple: "#9b59b6",
  orange: "#e67e22",
  cyan: "#1abc9c",
  pink: "#ff6bcb",
  gray: "#bdc3c7",
};

const AVAILABLE_COLORS = [
  { value: "blue", label: "🔵 Azul" },
  { value: "green", label: "🟢 Verde" },
  { value: "yellow", label: "🟡 Amarillo" },
  { value: "purple", label: "🟣 Morado" },
  { value: "orange", label: "🟠 Naranja" },
  { value: "cyan", label: "🟦 Cian" },
  { value: "pink", label: "🌸 Rosa" },
  { value: "gray", label: "⚪ Gris" },
];

export default forwardRef(function GraphPlayToolbar({ graphCanvasRef, onAttemptsUpdate, onSelectedAttemptChange, onReset }, ref) {
  const [colorCount, setColorCount] = useState(3);
  const [selectedColors, setSelectedColors] = useState([
    "blue",
    "purple",
    "yellow",
  ]);
  const [limitHit, setLimitHit] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // lista de intentos
  const [attempts, setAttempts] = useState([]);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("las_vegas");
  const [findValidSolution, setFindValidSolution] = useState("yes");
  const [acceptanceProbability, setAcceptanceProbability] = useState(0.5);
  const [numberOfAttempts, setNumberOfAttempts] = useState(50);

  const clearAttempts = () => {
    console.log("Clearing attempts in GraphPlayToolbar");
    setAttempts([]);
    setCurrentAttemptIndex(null);
  };

  // Expose clearAttempts to parent via ref
  useImperativeHandle(ref, () => ({
    clearAttempts,
  }), []);

  // Ajusta selección si colorCount baja
  useEffect(() => {
    if (selectedColors.length > colorCount) {
      setSelectedColors((prev) => prev.slice(0, colorCount));
    }
  }, [colorCount, selectedColors.length]);

  // Resetear el feedback visual después de un momento
  useEffect(() => {
    if (limitHit) {
      const t = setTimeout(() => setLimitHit(false), 600);
      return () => clearTimeout(t);
    }
  }, [limitHit]);

  const handleColorCountChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 3 && value <= 10) {
      setColorCount(value);
    }
  };

  const toggleColor = (value) => {
    if (selectedColors.includes(value)) {
      setSelectedColors((prev) => prev.filter((c) => c !== value));
      return;
    }

    if (selectedColors.length < colorCount) {
      setSelectedColors((prev) => [...prev, value]);
      return;
    }

    setLimitHit(true);
  };

  // Ejecutar algoritmo desde Play
  const handlePlayClick = () => {
    if (!graphCanvasRef?.current) return;

    setIsExecuting(true);

    // Usar setTimeout para que la UI se actualice antes de iniciar el cálculo
    setTimeout(() => {
      // Capturar el algoritmo seleccionado en este momento
      const currentAlgorithm = selectedAlgorithm;
      const algorithmName = currentAlgorithm === "las_vegas" ? "Las Vegas" : "Monte Carlo";

      let { nodes, edges } =
        typeof graphCanvasRef.current.getGraph === "function"
          ? graphCanvasRef.current.getGraph()
          : { nodes: [], edges: [] };

      // Si no hay grafo, generar uno
      if (!nodes || nodes.length === 0) {
        const nodeCount = Math.floor(Math.random() * (150 - 140 + 1)) + 140;
        const gridGraph = generateUniformGridGraph(nodeCount);
        nodes = gridGraph.nodes;
        edges = gridGraph.edges;
      }

      // Construir adyacencia UNA vez
      const adjacency = new Map(
        nodes.map((n, idx) => [String(n.id ?? idx + 1), new Set()])
      );

      edges.forEach((e) => {
        const a = String(e.source);
        const b = String(e.target);
        if (adjacency.has(a) && adjacency.has(b)) {
          adjacency.get(a).add(b);
          adjacency.get(b).add(a);
        }
      });

      const baseGraphForAlgo = nodes.map((n, idx) => {
        const id = String(n.id ?? idx + 1);
        return [id, 0, Array.from(adjacency.get(id) ?? [])];
      });

      const baseNodes = nodes.map((n, idx) => ({
        ...n,
        id: String(n.id ?? idx + 1),
      }));

      const k = selectedColors.length;
      if (k < 3) {
        alert("Se necesitan al menos 3 colores.");
        setIsExecuting(false);
        return;
      }

      const newBatch = [];
      let lastGraph = baseNodes;
      const batchStartTime = performance.now();
      const allIterations = [];
      const allConflicts = [];

      // ===== EJECUTAR N INTENTOS =====
      for (let i = 0; i < numberOfAttempts; i++) {

        const result = manager.executeAlgorithm(
          currentAlgorithm,
          baseGraphForAlgo,
          k,
          { 
            maxIterations: 2000,
            findValidSolution: findValidSolution === "yes",
            acceptanceProbability: parseFloat(acceptanceProbability)
          }
        );

        const colorMapAlgo = new Map(
          (result.coloring || []).map(([id, idxColor]) => [
            String(id),
            idxColor,
          ])
        );

        const coloredNodes = baseNodes.map((n) => {
          const id = String(n.id);
          const colorIndex = colorMapAlgo.get(id) ?? 0;
          const paletteIndex = colorIndex % k;
          const colorName = selectedColors[paletteIndex];
          const displayColor = COLOR_MAP[colorName] || colorName || "#e74c3c";

          return {
            ...n,
            data: {
              ...(n.data || {}),
              colorIndex,
              displayColor,
            },
          };
        });

        // Capturar estadísticas del resultado
        const stats = result.stats || {};
        const iterationData = {
          iteration: i + 1,
          totalIterations: stats.iterations || 0,
          totalConflicts: stats.conflicts || 0,
          executionTime: stats.execution_time || 0,
          isSuccessful: stats.success !== false,
        };

        allIterations.push(stats.iterations || 0);
        allConflicts.push(stats.conflicts || 0);

        newBatch.push({
          id: attempts.length + newBatch.length + 1,
          timestamp: new Date().toLocaleTimeString(),
          nodes: JSON.parse(JSON.stringify(coloredNodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          palette: [...selectedColors],
          k,
          algorithm: algorithmName,
          ...iterationData,
          hasConflicts: stats.conflicts > 0, // Marcar si tiene conflictos
          // Datos para gráficas de conflictos por iteración
          conflictsByIteration: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => 
            Math.max(0, stats.conflicts - Math.random() * 2)
          ), // Simulación de evolución
        });

        lastGraph = coloredNodes;
      }

      const batchEndTime = performance.now();
      const avgExecutionTime = (batchEndTime - batchStartTime) / 50;

      // Guardar todos los intentos
      const updatedAttempts = [...attempts, ...newBatch];
      setAttempts(updatedAttempts);
      
      // Notificar al componente padre
      if (onAttemptsUpdate) {
        onAttemptsUpdate(updatedAttempts);
      }

      // Mostrar el último
      const newIndex = updatedAttempts.length - 1;
      setCurrentAttemptIndex(newIndex);
      
      if (onSelectedAttemptChange) {
        onSelectedAttemptChange(newIndex);
      }

      graphCanvasRef.current.setGraph(lastGraph, edges);
      setIsExecuting(false);
    }, 100);
  };

  const handleLoadAttempt = (index) => {
    const att = attempts[index];
    if (!att || !graphCanvasRef?.current) return;
    setCurrentAttemptIndex(index);
    
    if (onSelectedAttemptChange) {
      onSelectedAttemptChange(index);
    }
    
    graphCanvasRef.current.setGraph(att.nodes, att.edges);
  };

  const canPlay = selectedColors.length === colorCount;

  return (
    <div className="graph-play-toolbar">
      {/* Overlay de carga */}
      {isExecuting && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Ejecutando algoritmo...</p>
        </div>
      )}

      <h3>Ejecución</h3>

      <button
        className="play-button"
        disabled={!canPlay || isExecuting}
        aria-disabled={!canPlay || isExecuting}
        title={
          canPlay
            ? "Ejecutar algoritmo"
            : `Selecciona ${colorCount} colores`
        }
        onClick={handlePlayClick}
      >
        <FaPlay className="play-icon" />
        <span className="play-text">Ejecutar algoritmo</span>
      </button>

      <label>Elegir algoritmo de ejecución:</label>
      <select 
        className="select-algorithm"
        value={selectedAlgorithm}
        onChange={(e) => setSelectedAlgorithm(e.target.value)}
        disabled={isExecuting}
      >
        <option value="las_vegas">Las vegas</option>
        <option value="monte_carlo">Monte Carlo</option>
      </select>

      <div className="option-select">
        <label>Encontrar solución válida:</label>
        <select 
          className="select-valid-solution"
          value={findValidSolution}
          onChange={(e) => setFindValidSolution(e.target.value)}
          disabled={isExecuting}
        >
          <option value="yes">Sí</option>
          <option value="no">No</option>
        </select>
      </div>

      {selectedAlgorithm === "monte_carlo" && (
        <div className="option-select">
          <label>Probabilidad de aceptación:</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={acceptanceProbability}
            onChange={(e) => setAcceptanceProbability(parseFloat(e.target.value))}
            className="probability-slider"
            disabled={isExecuting}
          />
          <span className="probability-value">{acceptanceProbability.toFixed(1)}</span>
        </div>
      )}

      <div className="option-select">
        <label>Cantidad de intentos:</label>
        <select 
          className="select-attempts"
          value={numberOfAttempts}
          onChange={(e) => setNumberOfAttempts(parseInt(e.target.value))}
          disabled={isExecuting}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
        </select>
      </div>

      <div className="color-config">
        <label>Cantidad de colores</label>
        <input
          type="number"
          min={3}
          max={10}
          value={colorCount}
          onChange={handleColorCountChange}
          disabled={isExecuting}
        />
      </div>

      <div className={`color-grid ${limitHit ? "limit-hit" : ""}`}>
        <label>Colores disponibles</label>
        <div
          className="color-options"
          role="listbox"
          aria-multiselectable="true"
        >
          {AVAILABLE_COLORS.map((c) => {
            const selected = selectedColors.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                role="option"
                aria-pressed={selected}
                className={`color-option ${c.value} ${
                  selected ? "selected" : ""
                }`}
                onClick={() => toggleColor(c.value)}
                disabled={isExecuting}
              >
                <span className="color-emoji">
                  {c.label.split(" ")[0]}
                </span>
                <span className="color-name">
                  {c.label.split(" ").slice(1).join(" ")}
                </span>
                {selected && <span className="checkmark">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="color-counter">
          {selectedColors.length} / {colorCount}
        </div>
      </div>

      {/* Lista de intentos */}
      <div className="attempts-panel">
        <h4>Intentos guardados</h4>
        {attempts.length === 0 && (
          <p className="attempts-empty">Todavía no hay intentos</p>
        )}
        <div className="attempts-list">
          {attempts.map((att, idx) => {
            // Encontrar el intento con menor número de conflictos
            const minConflicts = Math.min(...attempts.map(a => a.totalConflicts));
            const isBestAttempt = att.totalConflicts === minConflicts;

            return (
              <button
                key={att.id}
                className={`attempt-button ${
                  idx === currentAttemptIndex ? "active" : ""
                } ${att.hasConflicts ? "has-conflicts" : ""} ${
                  isBestAttempt ? "best-attempt" : ""
                }`}
                onClick={() => handleLoadAttempt(idx)}
                disabled={isExecuting}
                title={
                  isBestAttempt
                    ? `Mejor intento (${minConflicts} conflictos)`
                    : att.hasConflicts
                    ? "Este intento tiene conflictos"
                    : "Sin conflictos"
                }
              >
                #{att.id} – {att.timestamp}
                {att.hasConflicts && <span className="conflict-badge">⚠</span>}
                {isBestAttempt && <span className="best-badge"></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});