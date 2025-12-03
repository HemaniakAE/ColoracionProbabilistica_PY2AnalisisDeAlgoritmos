import './GraphToolBar.css'
import { RiAddCircleFill } from "react-icons/ri";
import { IoMdRemoveCircle } from "react-icons/io";
import { MdLoop } from "react-icons/md";

export default function GraphToolbar({ onDeleteNodes, removeMode = false, onRotateColors, selectedColors = [], selectedNodeId = null }) {
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

      <button 
        className='rotate-colors-button'
        onClick={onRotateColors}
        disabled={!selectedColors || selectedColors.length < 2 || !selectedNodeId}
        title={
          !selectedNodeId 
            ? "Selecciona un nodo primero"
            : selectedColors && selectedColors.length >= 2 
              ? `Rotar colores en nodo ${selectedNodeId}`
              : "Necesitas al menos 2 colores seleccionados"
        }
      >
        <MdLoop className='rotate-icon' />
        <span className='rotate-text'>
          {selectedNodeId ? `Rotar (${selectedNodeId})` : "Seleccionar"}
        </span>
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
