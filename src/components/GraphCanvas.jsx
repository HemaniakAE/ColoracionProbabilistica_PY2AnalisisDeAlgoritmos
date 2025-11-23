import { useCallback, useRef, useMemo } from "react";
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

let id = 0;
const getId = () => `node_${id++}`;

// Definir nodeTypes fuera del componente
const nodeTypes = { circle: CircleNode };

export default function GraphCanvas({ removeMode, setRemoveMode }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef(null);

  // Manejar click en nodos
  const handleNodeClick = useCallback((event, node) => {
    if (removeMode) {
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
      setRemoveMode(false);
    }
  }, [removeMode, setNodes, setEdges, setRemoveMode]);

  // Manejar click en el canvas vacío
  const handlePaneClick = useCallback(() => {
    if (removeMode) {
      setRemoveMode(false);
    }
  }, [removeMode, setRemoveMode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type: "circle",
        position,
        data: { label: nodes.length + 1 },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, nodes, reactFlowInstance]
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="graph-canvas-wrapper" ref={reactFlowWrapper}>
      <div 
        className="graph-canvas" 
        style={{ cursor: removeMode ? 'not-allowed' : 'default' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} 
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onInit={(instance) => (reactFlowInstance.current = instance)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          panOnScroll
          zoomOnPinch
          nodeTypes={nodeTypes}
          nodesDraggable={!removeMode}
          nodesConnectable={!removeMode}
          elementsSelectable={!removeMode}
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}