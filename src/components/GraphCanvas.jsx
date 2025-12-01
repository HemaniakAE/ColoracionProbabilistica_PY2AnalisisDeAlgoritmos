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
 * ✅ VALIDACIÓN AUTOMÁTICA DE CONEXIONES
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

    // Solo permitimos la arista si ambos nodos aún están debajo de su límite
    if (da < maxA && db < maxB) {
      filtered.push(e);
      degree.set(a, da + 1);
      degree.set(b, db + 1);
    }
  });

  return filtered;
}

const GraphCanvas = forwardRef(({ disableOnConnect = false }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const wrapperRef = useRef(null);
  const reactFlowInstance = useRef(null);

  // ===== API imperativa para AutomaticExecute / PlayToolbar =====
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Recibe nodos y aristas desde el algoritmo / toolbar y
       * los normaliza + aplica límites de conexiones.
       */
      setGraph: (newNodes = [], newEdges = []) => {
        // 1) Normalizar nodos
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

        // 2) Normalizar aristas crudas (y eliminar las que apunten a nodos inexistentes)
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

        // 3) ✅ Aplicar límites automáticos a las conexiones
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
    }),
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

        // ✅ Aplicar el mismo límite cuando conectas a mano
        return enforceConnectionLimits(withNew);
      });
    },
    [disableOnConnect]
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
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
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
