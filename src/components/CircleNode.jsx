import { Handle, Position } from "reactflow";

export default function CircleNode({ data }) {
  const color = data?.displayColor || "#3498db";

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: color,
        border: "2px solid #000",
        position: "relative",
      }}
    >
      {/* ARRIBA */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)" }}
      />

      {/* ABAJO */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)"}}
      />

      {/* IZQUIERDA */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ width: 8, height: 8 ,background: "rgba(0,0,0,0.2)" }}
      />

      {/* DERECHA */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ width: 8, height: 8 , background: "rgba(0,0,0,0.2)"}}
      />
    </div>
  );
}
