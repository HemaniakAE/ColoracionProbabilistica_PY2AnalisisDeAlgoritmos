// src/components/CircleNode.jsx
import { Handle, Position } from "reactflow";

const COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f1c40f",
  "#9b59b6",
  "#e67e22",
];

export default function CircleNode({ data }) {
  const colorIndex = data?.colorIndex ?? 0;
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid black",
      }}
    >
      {/* SIN TEXTO, solo el círculo */}

      {/* Handles para poder conectar (lo vemos en el paso 2) */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Top} />
      <Handle type="target" position={Position.Bottom} />
    </div>
  );
}
