import {
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";

import "reactflow/dist/style.css";
import "./GraphCanvas.css";
import CircleNode from "./CircleNode";

const nodeTypes = { circle: CircleNode };

/**
 * 🎨 Colores para clic manual en nodos
 */
const MANUAL_COLORS = [
  "#3498db", // azul
  "#2ecc71", // verde
  "#f1c40f", // amarillo
  "#9b59b6", // morado
  "#e67e22", // naranja
  "#1abc9c", // cian
  "#ff6bcb", // rosa
  "#bdc3c7", // gris
];

/**
 * VALIDACIÓN AUTOMÁTICA DE CONEXIONES
 * - Nodo "1": máximo 2 conexiones
 * - Todos los demás nodos: máximo 3 conexiones
 */
function enforceConnectionLimits(edges) {
  const degree = new Map();
  const filtered = [];

  edges.forEach((e) => {
    const a = String(e.source);
    const b = String(e.target);

    const da = degree.get(a) || 0;
    const db = degree.get(b) || 0;

    const maxA = a === "1" ? 2 : 3;
    const maxB = b === "1" ? 2 : 3;

    if (da < maxA && db < maxB) {
      filtered.push(e);
      degree.set(a, da + 1);
      degree.set(b, db + 1);
    }
  });

  return filtered;
}

/**
 * 🧠 Marca las aristas en conflicto (mismo color en ambos extremos)
 * Devuelve un nuevo array de edges con estilos actualizados.
 */
function applyConflictStyles(edges, nodes) {
  const colorById = new Map(
    nodes.map((n) => [String(n.id), n.data?.colorIndex])
  );

  return edges.map((e) => {
    const sourceId = String(e.source);
    const targetId = String(e.target);

    const c1 = colorById.get(sourceId);
    const c2 = colorById.get(targetId);

    const hasConflict =
      typeof c1 === "number" &&
      typeof c2 === "number" &&
      c1 === c2;

    return {
      ...e,
      style: {
        ...(e.style || {}),
        stroke: hasConflict ? "#e74c3c" : "#ffffff",
        strokeWidth: hasConflict ? 3 : 1.5,
      },
      data: {
        ...(e.data || {}),
        hasConflict,
      },
    };
  });
}

const GraphCanvas = forwardRef(({ disableOnConnect = false }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const wrapperRef = useRef(null);
  const reactFlowInstance = useRef(null);

  // Exponer métodos para controlar el grafo desde el exterior (versión original)
  useImperativeHandle(
    ref,
    () => ({
      setGraph: (newNodes, newEdges) => {
        const normalizedNodes = (newNodes || []).map((n, idx) => ({
          id: String(n.id ?? `node_${idx}`),
          type: n.type ?? "circle",
          position: n.position ?? { x: 0, y: 0 },
          data: n.data ?? { label: idx + 1 },
        }));

        const normalizedEdgesRaw = (newEdges || []).map((e, idx) => ({
          id: e && e.id ? String(e.id) : `edge_${idx}`,
          source: e && e.source ? String(e.source) : undefined,
          target: e && e.target ? String(e.target) : undefined,
          type: e && e.type ? e.type : "default",
          className: e && e.className ? e.className : "white-edge",
          style:
            e && e.style
              ? e.style
              : { stroke: "#ffffff", strokeWidth: 2 },
          animated:
            e && typeof e.animated === "boolean" ? e.animated : false,
        }));

        const nodeIdSet = new Set(normalizedNodes.map((n) => n.id));
        const normalizedEdges = normalizedEdgesRaw.filter((e) => {
          if (!e.source || !e.target) return false;
          if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target))
            return false;
          return true;
        });

        setNodes(normalizedNodes);
        setEdges(normalizedEdges);

        setTimeout(() => {
          try {
            if (reactFlowInstance.current) {
              if (
                typeof reactFlowInstance.current.setNodes === "function"
              ) {
                reactFlowInstance.current.setNodes(normalizedNodes);
              }
              if (
                typeof reactFlowInstance.current.setEdges === "function"
              ) {
                reactFlowInstance.current.setEdges(normalizedEdges);
              }
            }
          } catch (err) {
            console.warn(
              "Error aplicando nodes/edges a reactFlowInstance",
              err
            );
          }
        }, 100);

        setTimeout(() => {
          try {
            if (
              reactFlowInstance.current &&
              typeof reactFlowInstance.current.fitView === "function"
            ) {
              reactFlowInstance.current.fitView({ padding: 0.1 });
            }
          } catch (err) {}
        }, 50);
      },
      resetGraph: () => {
        setNodes([]);
        setEdges([]);
      },
      getGraph: () => ({
        nodes: reactFlowInstance.current
          ? reactFlowInstance.current.getNodes()
          : [],
        edges: reactFlowInstance.current
          ? reactFlowInstance.current.getEdges()
          : [],
      }),
    }),
    [setNodes, setEdges]
  );

  // API imperativa para AutomaticExecute / PlayToolbar
  useImperativeHandle(
    ref,
    () => ({
      setGraph: (newNodes = [], newEdges = []) => {
        const normalizedNodes = newNodes.map((n, idx) => {
          const id = String(n.id ?? idx + 1);
          return {
            id,
            type: "circle",
            position:
              n.position ?? {
                x: 100 + (idx % 15) * 70,
                y: 80 + Math.floor(idx / 15) * 70,
              },
            data: n.data ?? {},
          };
        });

        const idSet = new Set(normalizedNodes.map((n) => n.id));

        const rawEdges = (newEdges || [])
          .map((e, idx) => {
            const source = String(e.source);
            const target = String(e.target);

            if (!idSet.has(source) || !idSet.has(target)) {
              console.warn("Arista inválida descartada:", e);
              return null;
            }

            return {
              id: String(e.id ?? `e-${idx}`),
              source,
              target,
              style: { stroke: "#ffffff", strokeWidth: 1.5 },
            };
          })
          .filter(Boolean);

        const limitedEdges = enforceConnectionLimits(rawEdges);

        setNodes(normalizedNodes);
        setEdges(limitedEdges);

        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2 });
        }
      },

      resetGraph: () => {
        setNodes([]);
        setEdges([]);
      },

      getGraph: () => ({ nodes, edges }),

      updateConflictStyles: () => {
        setEdges((currentEdges) => applyConflictStyles(currentEdges, nodes));
      },
    }),
    [nodes, edges, setNodes, setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      if (disableOnConnect) return;

      setEdges((eds) => {
        const withNew = addEdge(
          {
            ...params,
            style: { stroke: "#ffffff", strokeWidth: 1.5 },
          },
          eds
        );

        return enforceConnectionLimits(withNew);
      });
    },
    [disableOnConnect, setEdges]
  );

  // 🎨 Cambio de color al hacer click en un nodo
  const onNodeClick = useCallback(
    (_, node) => {
      setNodes((prev) => {
        const updated = prev.map((n) => {
          if (n.id !== node.id) return n;

          const currentIndex =
            typeof n.data?.colorIndex === "number" ? n.data.colorIndex : 0;
          const nextIndex = (currentIndex + 1) % MANUAL_COLORS.length;
          const nextColor = MANUAL_COLORS[nextIndex];

          return {
            ...n,
            data: {
              ...(n.data || {}),
              colorIndex: nextIndex,
              displayColor: nextColor,
            },
          };
        });

        // actualizar estilos de conflicto
        setEdges((currentEdges) => applyConflictStyles(currentEdges, updated));
        return updated;
      });
    },
    [setNodes, setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      if (!reactFlowInstance.current || !wrapperRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const id = String(nodes.length + 1);

      const newNode = {
        id,
        type: "circle",
        position,
        data: {},
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [nodes, setNodes]
  );

  return (
    <div className="graph-canvas" ref={wrapperRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        minZoom={0.05}
        maxZoom={2}
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
});

GraphCanvas.displayName = "GraphCanvas";
export default GraphCanvas;
