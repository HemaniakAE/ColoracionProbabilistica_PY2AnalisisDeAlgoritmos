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

  // lista de intentos
  const [attempts, setAttempts] = useState([]);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("las_vegas");

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

  // Capturar el algoritmo seleccionado en este momento
  const currentAlgorithm = selectedAlgorithm;
  const algorithmName = currentAlgorithm === "las_vegas" ? "Las Vegas" : "Monte Carlo";

  let { nodes, edges } =
    typeof graphCanvasRef.current.getGraph === "function"
      ? graphCanvasRef.current.getGraph()
      : { nodes: [], edges: [] };

  // Si no hay grafo, generar uno
  if (!nodes || nodes.length === 0) {
    const nodeCount = Math.floor(Math.random() * (150 - 100 + 1)) + 100;
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
    return;
  }

  const newBatch = [];
  let lastGraph = baseNodes;
  const batchStartTime = performance.now();
  const allIterations = [];
  const allConflicts = [];

  // ===== EJECUTAR 50 INTENTOS =====
  for (let i = 0; i < 50; i++) {

    const result = manager.executeAlgorithm(
      currentAlgorithm,
      baseGraphForAlgo,
      k,
      { maxIterations: 2000 }
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
      <h3>Ejecución</h3>

      <button
        className="play-button"
        disabled={!canPlay}
        aria-disabled={!canPlay}
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
      >
        <option value="las_vegas">Las vegas</option>
        <option value="monte_carlo">Monte Carlo</option>
      </select>

      <div className="color-config">
        <label>Cantidad de colores</label>
        <input
          type="number"
          min={3}
          max={10}
          value={colorCount}
          onChange={handleColorCountChange}
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
          {attempts.map((att, idx) => (
            <button
              key={att.id}
              className={
                idx === currentAttemptIndex
                  ? "attempt-button active"
                  : "attempt-button"
              }
              onClick={() => handleLoadAttempt(idx)}
            >
              #{att.id} – {att.timestamp}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});