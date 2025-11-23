import './GraphToolBar.css'
import { RiAddCircleFill } from "react-icons/ri";
import { IoMdRemoveCircle } from "react-icons/io";

export default function GraphToolbar({ onAddNode, onDeleteNodes }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData("application/reactflow", "circle");
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="graph-toolbar">
      <h3>Herramientas</h3>

      <button draggable onDragStart={onDragStart}>
        <RiAddCircleFill className="addnode-icon" />
        <span className="add-text">Añadir nodo</span>
      </button>

      <button onClick={onDeleteNodes}>
        <IoMdRemoveCircle className='removenode-icon' />
        <span className='remote-text'>Quitar nodo</span>
      </button>
    </div>
  );
}
