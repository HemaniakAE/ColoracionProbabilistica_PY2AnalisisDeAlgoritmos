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

const GraphCanvas = forwardRef(({ disableOnConnect = false, removeMode = false }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const wrapperRef = useRef(null);
  const reactFlowInstance = useRef(null);

  useImperativeHandle(ref, () => ({
    setGraph: (newNodes = [], newEdges = []) => {
      const normalizedNodes = newNodes.map((n, idx) => {
        const id = String(n.id ?? idx + 1);
        return {
          id,
          type: "circle",
          position: n.position ?? {
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

    removeNode: (nodeId) => {
      console.log(`Eliminando nodo: ${nodeId}`);
      setNodes(prev => prev.filter(node => node.id !== nodeId));
      setEdges(prev => prev.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
    },
  }), [nodes, edges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => {
      if (disableOnConnect) {
        console.log("Conexiones deshabilitadas (modo eliminación activo)");
        return;
      }

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
    [disableOnConnect]
  );

  const onNodeClick = useCallback((event, node) => {
    console.log(`Nodo clickeado: ${node.id}, removeMode: ${removeMode}`);
    
    if (removeMode) {
      setNodes(prev => prev.filter(n => n.id !== node.id));
      setEdges(prev => prev.filter(edge => 
        edge.source !== node.id && edge.target !== node.id
      ));
      console.log(`✅ Nodo ${node.id} eliminado`);
    }
  }, [removeMode, setNodes, setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      if (!reactFlowInstance.current || !wrapperRef.current) {
        console.error("Instancia de React Flow no disponible");
        return;
      }

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNodeId = `manual_node_${Date.now()}_${nodes.length}`;
      
      const newNode = {
        id: newNodeId,
        type: "circle",
        position,
        data: { 
          label: `N${nodes.length + 1}`,
          colorIndex: nodes.length % 3,
          displayColor: nodes.length % 3 === 0 ? "#3498db" : 
                       nodes.length % 3 === 1 ? "#2ecc71" : "#f1c40f"
        },
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [nodes, setNodes]
  );

  return (
    <div className="graph-canvas" ref={wrapperRef}>
      {removeMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(231, 76, 60, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          zIndex: 10,
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)',
          animation: 'pulse 1.5s infinite',
          border: '2px solid #ff6b6b'
        }}>
           MODO ELIMINACIÓN - Haz clic en nodos para eliminarlos
        </div>
      )}
      
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
        onNodeClick={onNodeClick}
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

const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);

GraphCanvas.displayName = "GraphCanvas";
export default GraphCanvas;