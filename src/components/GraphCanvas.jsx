import {
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
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

// Detecta conflictos en las aristas
function detectConflictEdges(nodes, edges) {
  const colorMap = new Map();
  
  // Crear mapa de colores
  nodes.forEach(node => {
    colorMap.set(String(node.id), node.data?.displayColor);
  });

  // Encontrar aristas en conflicto
  const conflictEdges = new Set();
  edges.forEach(edge => {
    const sourceColor = colorMap.get(String(edge.source));
    const targetColor = colorMap.get(String(edge.target));
    
    if (sourceColor === targetColor && sourceColor) {
      conflictEdges.add(edge.id);
    }
  });

  return conflictEdges;
}

const GraphCanvas = forwardRef(({ disableOnConnect = false, removeMode = false, selectedColors = [], selectedNodeId = null, onNodeSelect = null }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [conflictEdges, setConflictEdges] = useState(new Set());
  const wrapperRef = useRef(null);
  const reactFlowInstance = useRef(null);

  // Detectar conflictos cuando cambien los nodos o aristas
  useEffect(() => {
    const conflicts = detectConflictEdges(nodes, edges);
    setConflictEdges(conflicts);
  }, [nodes, edges]);

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

    rotateColors: (colors) => {
      if (!colors || colors.length === 0) {
        console.warn("No hay colores seleccionados para rotar");
        return;
      }

      setNodes(prevNodes => 
        prevNodes.map(node => {
          const currentColor = node.data?.displayColor;
          const currentIndex = colors.findIndex(c => COLOR_MAP[c] === currentColor);
          const nextIndex = (currentIndex + 1) % colors.length;
          const nextColorKey = colors[nextIndex];
          const nextColor = COLOR_MAP[nextColorKey];

          return {
            ...node,
            data: {
              ...node.data,
              displayColor: nextColor,
              colorKey: nextColorKey,
            }
          };
        })
      );
    },

    rotateNodeColor: (nodeId, colors) => {
      if (!colors || colors.length === 0) {
        console.warn("No hay colores seleccionados para rotar");
        return;
      }

      setNodes(prevNodes =>
        prevNodes.map(node => {
          if (String(node.id) !== String(nodeId)) {
            return node;
          }

          const currentColor = node.data?.displayColor;
          const currentIndex = colors.findIndex(c => COLOR_MAP[c] === currentColor);
          const nextIndex = (currentIndex + 1) % colors.length;
          const nextColorKey = colors[nextIndex];
          const nextColor = COLOR_MAP[nextColorKey];

          return {
            ...node,
            data: {
              ...node.data,
              displayColor: nextColor,
              colorKey: nextColorKey,
            }
          };
        })
      );
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
    } else {
      // Seleccionar el nodo si no estamos en modo eliminación
      if (onNodeSelect) {
        onNodeSelect(node.id);
        console.log(`✅ Nodo ${node.id} seleccionado para rotar color`);
      }
      
      // Resaltar el nodo seleccionado
      setNodes(prev => prev.map(n => ({
        ...n,
        data: {
          ...n.data,
          isSelected: String(n.id) === String(node.id)
        }
      })));
    }
  }, [removeMode, setNodes, setEdges, onNodeSelect]);

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
      
      // Usar colores seleccionados o defaults
      const defaultColors = selectedColors.length > 0 ? selectedColors : ["blue", "green", "yellow"];
      const colorKey = defaultColors[nodes.length % defaultColors.length];
      const displayColor = COLOR_MAP[colorKey];
      
      const newNode = {
        id: newNodeId,
        type: "circle",
        position,
        data: { 
          label: `N${nodes.length + 1}`,
          colorIndex: nodes.length % defaultColors.length,
          displayColor: displayColor,
          colorKey: colorKey,
        },
      };

      setNodes((prev) => [...prev, newNode]);
    },
    [nodes, setNodes, selectedColors]
  );

  // Aplicar estilos a aristas en conflicto
  const styledEdges = edges.map(edge => {
    const isConflict = conflictEdges.has(edge.id);
    return {
      ...edge,
      style: isConflict 
        ? { 
            stroke: "#e74c3c", 
            strokeWidth: 3,
            animation: "edge-pulse 0.6s infinite"
          }
        : { stroke: "#ffffff", strokeWidth: 1.5 }
    };
  });

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
        edges={styledEdges}
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
  
  @keyframes edge-pulse {
    0% { opacity: 1; stroke-width: 3; }
    50% { opacity: 0.6; stroke-width: 4; }
    100% { opacity: 1; stroke-width: 3; }
  }
`;
document.head.appendChild(style);

GraphCanvas.displayName = "GraphCanvas";
export default GraphCanvas;