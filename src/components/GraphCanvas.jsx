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
import { getConflictingEdges } from "../algorithms/coloringUtils";

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
 * Aplica estilos de conflicto a aristas basado en los colores actuales de los nodos.
 * Usa getConflictingEdges(coloredGraph) — no se cambia la lógica de conflictos.
 *
 * Nota: getConflictingEdges se espera que reciba un array del tipo:
 *   [nodeId, colorIndex, neighborsArray]
 * y devuelva un Set (o estructura con .has()) con claves de arista en el formato "a-b"
 * (normalizadas con sort) — eso se mantiene.
 */
function applyConflictStyles(edges, nodes) {
  // Construir estructura de grafo coloreado para usar getConflictingEdges
  const coloredGraph = nodes.map((node) => {
    // Preferir colorIndex manual si existe; sino usar color numérico del algoritmo (si hubiera)
    const colorIndex =
      typeof node.data?.colorIndex === "number"
        ? node.data.colorIndex
        : typeof node.data?.color === "number"
        ? node.data.color
        : 0;

    // Encontrar vecinos basado en las aristas
    const neighbors = edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .map((e) => (e.source === node.id ? e.target : e.source));

    return [String(node.id), colorIndex, neighbors];
  });

  // Obtener aristas en conflicto usando la función utilitaria
  let conflictingEdgeIds = new Set();
  try {
    const res = getConflictingEdges ? getConflictingEdges(coloredGraph) : null;
    // Aceptamos que res sea Set o Array; convertir a Set
    if (res instanceof Set) conflictingEdgeIds = res;
    else if (Array.isArray(res)) conflictingEdgeIds = new Set(res);
    else if (res && typeof res.has === "function") conflictingEdgeIds = res;
    else conflictingEdgeIds = new Set();
  } catch (err) {
    // Si la util falla, no rompemos; dejamos vacío el conjunto de conflictos
    // eslint-disable-next-line no-console
    console.warn("getConflictingEdges falló:", err);
    conflictingEdgeIds = new Set();
  }

  // Aplicar estilos basado en conflictos identificados
  return edges.map((edge) => {
    // Normalizar clave para buscar en conflictingEdgeIds
    const edgeKey = [String(edge.source), String(edge.target)].sort().join("-");
    const isConflict = conflictingEdgeIds.has(edgeKey);

    if (isConflict) {
      return {
        ...edge,
        className: edge.className ? `${edge.className} conflict-edge` : "conflict-edge",
        style: {
          ...(edge.style || {}),
          stroke: "#e74c3c",
          strokeWidth: 3,
        },
      };
    }
    return {
      ...edge,
      className: edge.className ?? "white-edge",
      style: edge.style ?? { stroke: "#ffffff", strokeWidth: 1.5 },
    };
  });
}

const GraphCanvas = forwardRef(({ disableOnConnect = false }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const wrapperRef = useRef(null);
  const reactFlowInstance = useRef(null);

  // ===== API imperativa (única, basada en la del segundo archivo) =====
  useImperativeHandle(
    ref,
    () => ({
      /**
       * setGraph: normaliza nodos/aristas, aplica límites y estilos de conflicto.
       * Conserva la lógica del segundo archivo, pero ahora soporta
       * colorIndex/displayColor para nodos (pintado manual).
       */
      setGraph: (newNodes = [], newEdges = []) => {
        // 1) Normalizar nodos
        const normalizedNodes = (newNodes || []).map((n, idx) => {
          const id = String(n.id ?? idx + 1);
          return {
            id,
            type: "circle",
            position:
              n.position ??
              {
                x: 100 + (idx % 15) * 70,
                y: 80 + Math.floor(idx / 15) * 70,
              },
            // conservar colorIndex/displayColor si vienen en 'n.data'
            data: {
              ...(n.data ?? {}),
              label: n.data?.label ?? Number(id),
            },
          };
        });

        const idSet = new Set(normalizedNodes.map((n) => n.id));

        // 2) Normalizar aristas crudas (y eliminar las que apunten a nodos inexistentes)
        const normalizedEdgesRaw = (newEdges || []).map((e, idx) => ({
          id: e && e.id ? String(e.id) : `edge_${idx}`,
          source: e && e.source ? String(e.source) : undefined,
          target: e && e.target ? String(e.target) : undefined,
          type: e && e.type ? e.type : "default",
          className: e && e.className ? e.className : "white-edge",
          style: e && e.style ? e.style : { stroke: "#ffffff", strokeWidth: 1.5 },
          animated: e && typeof e.animated === "boolean" ? e.animated : false,
        }));

        const filteredEdges = normalizedEdgesRaw.filter((e) => {
          if (!e.source || !e.target) return false;
          if (!idSet.has(e.source) || !idSet.has(e.target)) return false;
          return true;
        });

        // Si se han descartado aristas, loguearlo para depuración
        if (normalizedEdgesRaw.length !== filteredEdges.length) {
          // eslint-disable-next-line no-console
          console.warn("GraphCanvas.setGraph: se descartaron aristas inválidas", {
            raw: normalizedEdgesRaw.length,
            valid: filteredEdges.length,
            invalidSamples: normalizedEdgesRaw.filter((e) => !e.source || !e.target).slice(0, 5),
          });
        }

        // Log de primer nodo/arista para depuración rápida
        // eslint-disable-next-line no-console
        console.log(
          "GraphCanvas.setGraph -> nodes, edges:",
          JSON.stringify(
            {
              nodesCount: normalizedNodes.length,
              edgesCountRaw: normalizedEdgesRaw.length,
              edgesCountFiltered: filteredEdges.length,
              firstNode: normalizedNodes[0],
              firstEdgeRaw: normalizedEdgesRaw[0],
              firstEdge: filteredEdges[0],
            },
            null,
            2
          )
        );

        // 3) Aplicar límites automáticos a las conexiones
        const limitedEdges = enforceConnectionLimits(filteredEdges);

        // 4) Aplicar estilos de conflicto (usa getConflictingEdges internamente)
        const styledEdges = applyConflictStyles(limitedEdges, normalizedNodes);

        // Guardar en estado
        setNodes(normalizedNodes);
        setEdges(styledEdges);

        // Sincronizar con la instancia de ReactFlow si existe
        setTimeout(() => {
          try {
            if (reactFlowInstance.current) {
              if (typeof reactFlowInstance.current.setNodes === "function") {
                reactFlowInstance.current.setNodes(normalizedNodes);
              }
              if (typeof reactFlowInstance.current.setEdges === "function") {
                reactFlowInstance.current.setEdges(styledEdges);
              }
              if (typeof reactFlowInstance.current.fitView === "function") {
                reactFlowInstance.current.fitView({ padding: 0.2 });
              }
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("Error sincronizando reactFlowInstance en setGraph", err);
          }
        }, 50);
      },

      resetGraph: () => {
        setNodes([]);
        setEdges([]);
      },

      getGraph: () => ({
        nodes: reactFlowInstance.current ? reactFlowInstance.current.getNodes() : nodes,
        edges: reactFlowInstance.current ? reactFlowInstance.current.getEdges() : edges,
      }),

      /**
       * Recalcula los estilos de conflicto de las aristas basado en los colores actuales
       * Útil cuando los colores de los nodos cambian dinámicamente (ej. clic manual).
       */
      updateConflictStyles: () => {
        setEdges((currentEdges) => applyConflictStyles(currentEdges, nodes));
      },
    }),
    // dependencias
    [nodes, edges, setNodes, setEdges]
  );

  // ===== Conexiones MANUALES: también pasan por enforceConnectionLimits =====
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

        // Aplicar el mismo límite cuando conectas a mano
        const limited = enforceConnectionLimits(withNew);

        // Aplicar estilos de conflicto en el resultado (usando nodos actuales)
        return applyConflictStyles(limited, nodes);
      });
    },
    [disableOnConnect, nodes]
  );

  // ===== 🎨 Cambio de color al hacer click en un nodo (funcionalidad añadida del primer archivo) =====
  const onNodeClick = useCallback(
    (event, node) => {
      // evitar comportamientos extra
      event?.stopPropagation?.();

      setNodes((prev) => {
        const updated = prev.map((n) => {
          if (n.id !== node.id) return n;

          const currentIndex = typeof n.data?.colorIndex === "number" ? n.data.colorIndex : 0;
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

        // actualizar estilos de conflicto tras el cambio manual
        setEdges((currentEdges) => applyConflictStyles(currentEdges, updated));
        return updated;
      });
    },
    [setNodes, setEdges]
  );

  // ===== Drag & drop desde la toolbar manual =====
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
        data: {}, // sin número / texto
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
