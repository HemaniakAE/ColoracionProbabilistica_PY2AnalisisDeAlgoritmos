import { Handle, Position } from "reactflow";

/**
 * Componente que representa un nodo circular dentro de React Flow.
 *
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.data - Información asociada al nodo.
 * @param {string} [props.data.displayColor="#3498db"] - Color visible del nodo.
 * @returns {JSX.Element} Nodo circular con cuatro puntos de conexión (arriba, abajo, izquierda y derecha).
 */
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
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)" }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)" }}
      />

      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)" }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ width: 8, height: 8, background: "rgba(0,0,0,0.2)" }}
      />
    </div>
  );
}
