import './GraphToolBar.css'
import { RiAddCircleFill } from "react-icons/ri";
import { IoMdRemoveCircle } from "react-icons/io";

export default function GraphToolbar({ onDeleteNodes }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData("application/reactflow", "circle");
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="graph-toolbar">
      <h3>Herramientas</h3>

      <button className='addnode-button' draggable onDragStart={onDragStart}>
        <RiAddCircleFill className="addnode-icon" />
        <span className="add-text">Añadir nodo</span>
      </button>

      <button className='removenode-button' onClick={onDeleteNodes}>
        <IoMdRemoveCircle className='removenode-icon' />
        <span className='remove-text'>Quitar nodo</span>
      </button>
    </div>
  );
}