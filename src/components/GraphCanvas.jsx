import { useState, useCallback } from "react";
import ReactFlow, { Background, Controls, addEdge } from "reactflow";
import "reactflow/dist/style.css";
import "./GraphCanvas.css";
import CircleNode from "./CircleNode";
import { ColoringAlgorithmManager } from "../algorithms";

const nodeTypes = { circle: CircleNode };

const K_COLORS = 4;
const AUTO_NODE_COUNT = 120;
const MAX_MANUAL_NODES = 60;

const manager = new ColoringAlgorithmManager();

// =======================
// UTILIDAD: contar grado
// =======================
function calcularGrados(nodes, edges) {
  const degree = new Map(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => {
    if (degree.has(e.source)) degree.set(e.source, degree.get(e.source) + 1);
    if (degree.has(e.target)) degree.set(e.target, degree.get(e.target) + 1);
  });
  return degree;
}

// =======================
// UTILIDAD: recolorear siempre
// =======================
function recalcularColores(nodes, edges) {
  if (nodes.length === 0) return nodes;

  const adjacency = new Map(nodes.map((n) => [n.id, new Set()]));

  edges.forEach((e) => {
    adjacency.get(e.source)?.add(e.target);
    adjacency.get(e.target)?.add(e.source);
  });

  const graph = nodes.map((n) => [
    n.id,
    0,
    Array.from(adjacency.get(n.id) ?? []),
  ]);

  const result = manager.executeAlgorithm("las_vegas", graph, K_COLORS, {
    maxIterations: 2000,
  });

  if (!result?.coloring) return nodes;

  return nodes.map((n) => {
    const entry = result.coloring.find((c) => c[0] === n.id);
    return {
      ...n,
      data: {
        ...n.data,
        colorIndex: entry ? entry[1] : 0,
      },
    };
  });
}

export default function GraphCanvas({ removeMode, setRemoveMode }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [intentoActual, setIntentoActual] = useState(null);

  // ==========================
  // CONECTAR NODOS MANUALMENTE
  // ==========================
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const grados = calcularGrados(nodes, eds);
        const a = params.source;
        const b = params.target;

        if ((grados.get(a) ?? 0) >= 2 || (grados.get(b) ?? 0) >= 2) {
          alert("Cada nodo puede tener como maximo 2 vecinos.");
          return eds;
        }

        const nuevosEdges = addEdge(params, eds);

        // AUTOMATICAMENTE recolorear
        setNodes((prev) => recalcularColores(prev, nuevosEdges));
        return nuevosEdges;
      });
    },
    [nodes]
  );

  // ==========================
  // GENERAR GRAFO AUTOMATICO
  // ==========================
  const generarGrafoColoreado = () => {
  const total = AUTO_NODE_COUNT;
  const cols = 12;
  const spacing = 80;

  const newNodes = Array.from({ length: total }, (_, i) => ({
    id: String(i + 1),
    type: "circle",
    position: {
      x: 100 + (i % cols) * spacing,
      y: 80 + Math.floor(i / cols) * spacing,
    },
    data: { colorIndex: 0, isManual: false },
  }));

  const adjacency = new Map(newNodes.map(n => [n.id, new Set()]));
  const newEdges = [];
  const degree = new Map(newNodes.map(n => [n.id, 0]));

  const conectar = (a, b) => {
    if (!adjacency.get(a).has(b)) {
      newEdges.push({ id: `e${a}-${b}`, source: a, target: b });
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);
      degree.set(a, degree.get(a) + 1);
      degree.set(b, degree.get(b) + 1);
    }
  };

  // 1) cadena base
  for (let i = 1; i < total; i++) {
    conectar(String(i), String(i + 1));
  }

  // 2) cerrar ciclo
  conectar("1", String(total));

  // 3) asegurar MINIMO 3 conexiones en todos EXCEPTO nodo 1
  let cambios = true;
  while (cambios) {
    cambios = false;

    newNodes.forEach(n => {
      const id = n.id;
      const objetivo = id === "1" ? 2 : 3;

      if (degree.get(id) < objetivo) {
        const posible = newNodes[Math.floor(Math.random() * newNodes.length)].id;
        if (posible !== id) {
          conectar(id, posible);
          cambios = true;
        }
      }
    });
  }

  const colored = recalcularColores(newNodes, newEdges);

  // ✅ guardar intento
  guardarIntento(colored, newEdges);

  setNodes(colored);
  setEdges(newEdges);
};


  const guardarIntento = (nodes, edges) => {
  const snapshot = {
    fecha: new Date().toLocaleTimeString(),
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };

  setHistorial(prev => [...prev, snapshot]);
  setIntentoActual(historial.length);
};

  const cargarIntento = (index) => {
  const intento = historial[index];
  if (!intento) return;
  setNodes(intento.nodes);
  setEdges(intento.edges);
  setIntentoActual(index);
};



  // ==========================
  // AGREGAR NODO MANUAL
  // ==========================
  const agregarNodoManual = () => {
    setNodes((prevNodes) => {
      const manualCount = prevNodes.filter((n) => n.data?.isManual).length;
      if (manualCount >= MAX_MANUAL_NODES) {
        alert("Maximo 60 nodos manuales.");
        return prevNodes;
      }

      const maxId =
        prevNodes.length === 0
          ? 0
          : Math.max(
              ...prevNodes.map((n) => Number(n.id)).filter((v) => !isNaN(v))
            );

      const newNode = {
        id: String(maxId + 1),
        type: "circle",
        position: {
          x: 100 + (manualCount % 10) * 80,
          y: 80 + 10 * 80 + Math.floor(manualCount / 10) * 80,
        },
        data: { colorIndex: 0, isManual: true },
      };

      const nuevosNodos = [...prevNodes, newNode];

      // AUTOMATICAMENTE recolorear
      return recalcularColores(nuevosNodos, edges);
    });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button onClick={generarGrafoColoreado}>
          Generar grafo automatico (120 nodos)
        </button>
        <button onClick={agregarNodoManual}>
          Agregar nodo manual (max 60)
        </button>
      </div>

      <div className="graph-canvas">
        <div style={{ marginBottom: "8px" }}>
  <strong>Intentos guardados:</strong>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
    {historial.map((_, i) => (
      <button
        key={i}
        onClick={() => cargarIntento(i)}
        style={{
          background: i === intentoActual ? "#16a085" : "#444",
          color: "white",
        }}
      >
        {i + 1}
      </button>
    ))}
  </div>
</div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          onConnect={onConnect}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
