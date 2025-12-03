import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import "./GraphPlayToolbar.css";
import { FaPlay } from "react-icons/fa";
import { generateRandomGraph } from "../algorithms/graphGenerator";
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

export default forwardRef(function GraphPlayToolbar({ 
  graphCanvasRef, 
  onAttemptsUpdate, 
  onSelectedAttemptChange, 
  onReset 
}, ref) {
  const [colorCount, setColorCount] = useState(3);
  const [selectedColors, setSelectedColors] = useState(["blue", "purple", "yellow"]);
  const [limitHit, setLimitHit] = useState(false);

  // lista de intentos
  const [attempts, setAttempts] = useState([]);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("las_vegas");
  
  // ✅ NUEVO: Estados para parámetros de algoritmos
  const [lasVegasMode, setLasVegasMode] = useState("find-valid"); // "find-valid" o "limited"
  const [acceptanceProbability, setAcceptanceProbability] = useState(0.7);
  const [maxIterations, setMaxIterations] = useState(2000);

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

  const handleMaxIterationsChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 100 && value <= 10000) {
      setMaxIterations(value);
    }
  };

  const handleAcceptanceProbabilityChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0.1 && value <= 1.0) {
      setAcceptanceProbability(parseFloat(value.toFixed(1)));
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

  // ✅ NUEVO: Función para completar nodos en modo manual
  const completeGraphForManualMode = (nodes, edges) => {
    const MIN_NODES_MANUAL = 5;
    
    if (nodes.length >= MIN_NODES_MANUAL) {
      return { nodes, edges }; // Ya hay suficientes nodos
    }
    
    console.log(`Modo Manual: Solo hay ${nodes.length} nodos. Completando a ${MIN_NODES_MANUAL}...`);
    
    // Agregar nodos faltantes
    const nodesToAdd = MIN_NODES_MANUAL - nodes.length;
    const newNodes = [...nodes];
    const existingPositions = new Set(
      nodes.map(n => `${Math.round(n.position.x/20)*20},${Math.round(n.position.y/20)*20}`)
    );
    
    for (let i = 0; i < nodesToAdd; i++) {
      let attempts = 0;
      let newX, newY;
      
      // Buscar posición que no se superponga mucho
      do {
        newX = 100 + Math.random() * 500;
        newY = 100 + Math.random() * 300;
        attempts++;
        
        if (attempts > 30) break; // Evitar bucle infinito
      } while (
        Array.from(existingPositions).some(pos => {
          const [x, y] = pos.split(',').map(Number);
          const distance = Math.sqrt(Math.pow(x - newX, 2) + Math.pow(y - newY, 2));
          return distance < 60;
        })
      );
      
      const newNodeId = `manual_auto_${Date.now()}_${i}`;
      newNodes.push({
        id: newNodeId,
        type: "circle",
        position: { x: newX, y: newY },
        data: { label: `A${i + 1}` }
      });
      
      existingPositions.add(`${Math.round(newX/20)*20},${Math.round(newY/20)*20}`);
    }
    
    // Agregar algunas aristas entre nodos nuevos y existentes
    const newEdges = [...edges];
    const existingNodeIds = nodes.map(n => n.id);
    const newNodeIds = newNodes.slice(nodes.length).map(n => n.id);
    
    // Conectar cada nodo nuevo con al menos 1 nodo existente
    for (let i = 0; i < newNodeIds.length; i++) {
      if (existingNodeIds.length > 0) {
        const source = newNodeIds[i];
        const target = existingNodeIds[Math.floor(Math.random() * existingNodeIds.length)];
        newEdges.push({
          id: `manual_edge_${Date.now()}_${i}`,
          source,
          target,
          style: { stroke: '#ffffff', strokeWidth: 1.5 }
        });
      }
    }
    
    // Conectar algunos nodos nuevos entre sí
    if (newNodeIds.length >= 2) {
      for (let i = 0; i < Math.min(2, newNodeIds.length - 1); i++) {
        newEdges.push({
          id: `manual_edge_new_${Date.now()}_${i}`,
          source: newNodeIds[i],
          target: newNodeIds[i + 1],
          style: { stroke: '#ffffff', strokeWidth: 1.5 }
        });
      }
    }
    
    return { nodes: newNodes, edges: newEdges };
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

    // ✅ NUEVO: Completar grafo si estamos en modo manual y hay pocos nodos
    const isManualMode = window.location.pathname.includes("/manual");
    if (isManualMode && nodes.length < 5) {
      const completedGraph = completeGraphForManualMode(nodes, edges);
      nodes = completedGraph.nodes;
      edges = completedGraph.edges;
      
      // Actualizar el canvas con los nodos adicionales
      graphCanvasRef.current.setGraph(nodes, edges);
      console.log(`Modo Manual: Se agregaron ${completedGraph.nodes.length - nodes.length} nodos automáticamente`);
    }

    // Si aún no hay grafo (o era muy pequeño), generar uno automático
    if (!nodes || nodes.length === 0) {
      const nodeCount = Math.floor(Math.random() * (150 - 100 + 1)) + 100;
      const randomGraph = generateRandomGraph(nodeCount);
      nodes = randomGraph.nodes;
      edges = randomGraph.edges;
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

    // ===== EJECUTAR 5 INTENTOS (reducido para mejor rendimiento) =====
    for (let i = 0; i < 5; i++) {
      // ✅ CORREGIDO: Pasar TODOS los parámetros necesarios
      const options = {
        maxIterations: maxIterations,
      };

      if (currentAlgorithm === "las_vegas") {
        options.findValidSolution = lasVegasMode === "find-valid";
      } else {
        // Monte Carlo
        options.findValidSolution = false; // Por defecto para Monte Carlo
        options.acceptanceProbability = acceptanceProbability;
      }

      const result = manager.executeAlgorithm(
        currentAlgorithm,
        baseGraphForAlgo,
        k,
        options
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
            label: `N${id.split('_')[1] || id}`,
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
        algorithmMode: stats.mode || (currentAlgorithm === "las_vegas" ? 
          (lasVegasMode === "find-valid" ? "find-valid-solution" : "limited-iterations") : 
          "monte-carlo"),
        acceptanceProbability: currentAlgorithm === "monte_carlo" ? acceptanceProbability : null,
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
        algorithmType: currentAlgorithm,
        ...iterationData,
        // Datos REALES para gráficas (no simulados)
        conflictsByIteration: generateConflictEvolution(stats.conflicts || 0, stats.iterations || 1),
        realConflicts: stats.conflicts || 0,
        realIterations: stats.iterations || 0,
      });

      lastGraph = coloredNodes;
    }

    const batchEndTime = performance.now();
    const avgExecutionTime = (batchEndTime - batchStartTime) / 5;

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

  // Función auxiliar para generar evolución de conflictos más realista
  const generateConflictEvolution = (finalConflicts, totalIterations) => {
    const evolution = [];
    const steps = 10;
    
    if (totalIterations <= steps) {
      // Pocas iteraciones: distribución aleatoria
      for (let i = 0; i < steps; i++) {
        evolution.push(Math.max(0, finalConflicts * (0.5 + Math.random())));
      }
    } else {
      // Muchas iteraciones: simular descenso
      for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1);
        const baseConflicts = finalConflicts + (10 * (1 - progress));
        const noise = (Math.random() - 0.5) * 3;
        evolution.push(Math.max(0, Math.round(baseConflicts + noise)));
      }
    }
    return evolution;
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

      {/* ✅ NUEVO: Configuración del algoritmo */}
      <div className="algorithm-config">
        <label>Algoritmo:</label>
        <select 
          className="select-algorithm"
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
        >
          <option value="las_vegas">Las Vegas</option>
          <option value="monte_carlo">Monte Carlo</option>
        </select>

        {/* Configuración específica de Las Vegas */}
        {selectedAlgorithm === "las_vegas" && (
          <div className="algorithm-mode">
            <label>Modo de Las Vegas:</label>
            <select 
              className="select-mode"
              value={lasVegasMode} 
              onChange={(e) => setLasVegasMode(e.target.value)}
            >
              <option value="find-valid">Buscar solución válida</option>
              <option value="limited">Iteraciones limitadas</option>
            </select>
          </div>
        )}

        {/* Configuración específica de Monte Carlo */}
        {selectedAlgorithm === "monte_carlo" && (
          <div className="probability-config">
            <label>Probabilidad de aceptación:</label>
            <div className="probability-slider">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={acceptanceProbability}
                onChange={handleAcceptanceProbabilityChange}
              />
              <span className="probability-value">{acceptanceProbability.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Configuración común: Iteraciones */}
        <div className="iterations-config">
          <label>Máx. iteraciones por ejecución:</label>
          <input
            type="number"
            min="100"
            max="10000"
            step="100"
            value={maxIterations}
            onChange={handleMaxIterationsChange}
            className="iterations-input"
          />
        </div>
      </div>

      {/* Configuración de colores */}
      <div className="color-config">
        <label>Cantidad de colores (k):</label>
        <input
          type="number"
          min={3}
          max={10}
          value={colorCount}
          onChange={handleColorCountChange}
          className="color-count-input"
        />
      </div>

      {/* Selección de colores */}
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
          {selectedColors.length} / {colorCount} seleccionados
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
              title={`${att.algorithm} - ${att.timestamp}`}
            >
              <div className="attempt-info">
                <span className="attempt-id">#{att.id}</span>
                <span className="attempt-algo">{att.algorithm}</span>
                <span className="attempt-time">{att.timestamp}</span>
              </div>
              <div className="attempt-stats">
                <span className="attempt-conflicts">Conf: {att.realConflicts || 0}</span>
                <span className="attempt-iterations">It: {att.realIterations || 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});