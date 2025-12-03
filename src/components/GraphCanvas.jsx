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

  // Exponer métodos para controlar el grafo desde el exterior
  useImperativeHandle(ref, () => ({
    setGraph: (newNodes, newEdges) => {
      // Normalizar nodos/edges y asegurarse de que tengan los campos necesarios
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
        type: e && e.type ? e.type : 'default',
        className: e && e.className ? e.className : 'white-edge',
        style: e && e.style ? e.style : { stroke: '#ffffff', strokeWidth: 2 },
        animated: e && typeof e.animated === 'boolean' ? e.animated : false,
      }));

      // Filtrar aristas inválidas (sin source/target o que refieren nodos inexistentes)
      const nodeIdSet = new Set(normalizedNodes.map((n) => n.id));
      const normalizedEdges = normalizedEdgesRaw.filter((e) => {
        if (!e.source || !e.target) return false;
        if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) return false;
        return true;
      });

      // Si se han descartado aristas, loguearlo para depuración
      if (normalizedEdgesRaw.length !== normalizedEdges.length) {
        // eslint-disable-next-line no-console
        console.warn('GraphCanvas.setGraph: se descartaron aristas inválidas', {
          raw: normalizedEdgesRaw.length,
          valid: normalizedEdges.length,
          invalidSamples: normalizedEdgesRaw.filter(e => !e.source || !e.target).slice(0,5),
        });
      }

      // Log de primer nodo/arista para depuración rápida (usar console.log para visibilidad)
      // eslint-disable-next-line no-console
      console.log('GraphCanvas.setGraph -> nodes, edges:', JSON.stringify({
        nodesCount: normalizedNodes.length,
        edgesCountRaw: normalizedEdgesRaw.length,
        edgesCountFiltered: normalizedEdges.length,
        firstNode: normalizedNodes[0],
        firstEdgeRaw: normalizedEdgesRaw[0],
        firstEdge: normalizedEdges[0],
      }, null, 2));

      setNodes(normalizedNodes);
      setEdges(normalizedEdges);

      // Si la instancia ya existe, forzar que la instancia actualice su estado interno
      setTimeout(() => {
        try {
          if (reactFlowInstance.current) {
            if (typeof reactFlowInstance.current.setNodes === 'function') {
              reactFlowInstance.current.setNodes(normalizedNodes);
            }
            if (typeof reactFlowInstance.current.setEdges === 'function') {
              reactFlowInstance.current.setEdges(normalizedEdges);
            }
          }
        } catch (err) {
          // no bloquear
          // eslint-disable-next-line no-console
          console.warn('Error aplicando nodes/edges a reactFlowInstance', err);
        }
      }, 100);

      // Forzar ajuste de vista para que las aristas y nodos sean visibles
      setTimeout(() => {
        try {
          if (reactFlowInstance.current && typeof reactFlowInstance.current.fitView === 'function') {
            reactFlowInstance.current.fitView({ padding: 0.1 });
          }
        } catch (err) {
          // no bloquear en caso de error
        }
      }, 50);
    },
    resetGraph: () => {
      setNodes([]);
      setEdges([]);
    },
    getGraph: () => ({ nodes: reactFlowInstance.current ? reactFlowInstance.current.getNodes() : [], edges: reactFlowInstance.current ? reactFlowInstance.current.getEdges() : [] }),
  }), [setNodes, setEdges]);

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
        minZoom={0.05}   // 👈 ¡Podes alejar muchísimo más!
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
