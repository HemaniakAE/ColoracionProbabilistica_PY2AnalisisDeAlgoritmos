import './GraphToolBar.css'
import { RiAddCircleFill } from "react-icons/ri";

export default function GraphToolbar() {
  const onDragStart = (event) => {
    event.dataTransfer.setData("application/reactflow", "circle");
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="graph-toolbar">
      <h3>Herramientas</h3>

      <button draggable onDragStart={onDragStart}>
        < RiAddCircleFill className='addnode-icon'/>
        <span className='add-text'>Añadir nodo</span>
      </button>
    </div>
  );
}
