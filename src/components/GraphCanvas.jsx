import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import "./GraphCanvas.css";

export default function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeDragStop = useCallback((event, node) => {
    console.log("Nodo movido:", node.id, node.position);
  }, []);

  return (
    <div className="graph-canvas-wrapper">
      <div className="graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          panOnScroll
          zoomOnPinch
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
