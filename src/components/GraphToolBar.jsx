import './GraphToolBar.css'
import { RiAddCircleFill } from "react-icons/ri";
import { IoMdRemoveCircle } from "react-icons/io";

export default function GraphToolbar({ onDeleteNodes, removeMode = false }) {
  const onDragStart = (event) => {
    event.dataTransfer.setData("application/reactflow", "circle");
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="graph-toolbar">
      <h3>Herramientas</h3>

      <button 
        className='addnode-button' 
        draggable 
        onDragStart={onDragStart}
        title="Arrastra y suelta para añadir nodo"
      >
        <RiAddCircleFill className="addnode-icon" />
        <span className="add-text">Añadir nodo</span>
      </button>

      <button 
        className={`removenode-button ${removeMode ? 'active' : ''}`} 
        onClick={onDeleteNodes}
        title={removeMode ? "Desactivar modo eliminación" : "Activar modo eliminación"}
      >
        <IoMdRemoveCircle className='removenode-icon' />
        <span className='remove-text'>
          {removeMode ? 'Desactivar Eliminación' : 'Quitar nodo'}
        </span>
        {removeMode && (
          <span style={{
            marginLeft: '8px',
            fontSize: '1.2rem',
            animation: 'pulse 1.5s infinite'
          }}></span>
        )}
      </button>

      {removeMode && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: 'rgba(231, 76, 60, 0.05)',
          border: '1px solid rgba(231, 76, 60, 0.2)',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#e74c3c',
          textAlign: 'center'
        }}>
          Haz clic en nodos para eliminarlos
        </div>
      )}
    </div>
  );
}