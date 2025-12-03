import { Handle, Position } from "reactflow";

export default function CircleNode({ data }) {
  const color = data?.displayColor || "#3498db";
  const isSelected = data?.isSelected || false;

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: color,
        border: isSelected ? "3px solid #fff700" : "2px solid #000",
        position: "relative",
        boxShadow: isSelected ? "0 0 15px 3px rgba(255, 247, 0, 0.8)" : "none",
        transition: "all 0.2s ease",
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
