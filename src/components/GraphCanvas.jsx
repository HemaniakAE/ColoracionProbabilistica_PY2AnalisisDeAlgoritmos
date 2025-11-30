import { useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";

import "reactflow/dist/style.css";
import "./GraphCanvas.css";
import CircleNode from "./CircleNode";

let id = 0;
const getId = () => `node_${id++}`;

// Definir nodeTypes fuera del componente
const nodeTypes = { circle: CircleNode };

const GraphCanvas = forwardRef(({ removeMode, setRemoveMode, disableOnConnect = false }, ref) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef(null);

  // Exponer métodos para controlar el grafo desde el exterior
  useImperativeHandle(ref, () => ({
    setGraph: (newNodes, newEdges) => {
      // Normalizar nodos/edges y asegurarse de que tengan los campos necesarios
      const normalizedNodes = (newNodes || []).map((n, idx) => ({
        id: String(n.id ?? `node_${idx}`),
        type: n.type ?? "circle",
        position: n.position ?? { x: 0, y: 0 },
        data: n.data ?? { label: idx + 1 },
      }));

      const normalizedEdgesRaw = (newEdges || []).map((e, idx) => ({
        id: e && e.id ? String(e.id) : `edge_${idx}`,
        source: e && e.source ? String(e.source) : undefined,
        target: e && e.target ? String(e.target) : undefined,
        type: e && e.type ? e.type : 'default',
        className: e && e.className ? e.className : 'white-edge',
        style: e && e.style ? e.style : { stroke: '#ffffff', strokeWidth: 2 },
        animated: e && typeof e.animated === 'boolean' ? e.animated : false,
      }));

      // Filtrar aristas inválidas (sin source/target o que refieren nodos inexistentes)
      const nodeIdSet = new Set(normalizedNodes.map((n) => n.id));
      const normalizedEdges = normalizedEdgesRaw.filter((e) => {
        if (!e.source || !e.target) return false;
        if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) return false;
        return true;
      });

      // Si se han descartado aristas, loguearlo para depuración
      if (normalizedEdgesRaw.length !== normalizedEdges.length) {
        // eslint-disable-next-line no-console
        console.warn('GraphCanvas.setGraph: se descartaron aristas inválidas', {
          raw: normalizedEdgesRaw.length,
          valid: normalizedEdges.length,
          invalidSamples: normalizedEdgesRaw.filter(e => !e.source || !e.target).slice(0,5),
        });
      }

      // Log de primer nodo/arista para depuración rápida (usar console.log para visibilidad)
      // eslint-disable-next-line no-console
      console.log('GraphCanvas.setGraph -> nodes, edges:', JSON.stringify({
        nodesCount: normalizedNodes.length,
        edgesCountRaw: normalizedEdgesRaw.length,
        edgesCountFiltered: normalizedEdges.length,
        firstNode: normalizedNodes[0],
        firstEdgeRaw: normalizedEdgesRaw[0],
        firstEdge: normalizedEdges[0],
      }, null, 2));

      setNodes(normalizedNodes);
      setEdges(normalizedEdges);

      // Si la instancia ya existe, forzar que la instancia actualice su estado interno
      setTimeout(() => {
        try {
          if (reactFlowInstance.current) {
            if (typeof reactFlowInstance.current.setNodes === 'function') {
              reactFlowInstance.current.setNodes(normalizedNodes);
            }
            if (typeof reactFlowInstance.current.setEdges === 'function') {
              reactFlowInstance.current.setEdges(normalizedEdges);
            }
          }
        } catch (err) {
          // no bloquear
          // eslint-disable-next-line no-console
          console.warn('Error aplicando nodes/edges a reactFlowInstance', err);
        }
      }, 100);

      // Forzar ajuste de vista para que las aristas y nodos sean visibles
      setTimeout(() => {
        try {
          if (reactFlowInstance.current && typeof reactFlowInstance.current.fitView === 'function') {
            reactFlowInstance.current.fitView({ padding: 0.1 });
          }
        } catch (err) {
          // no bloquear en caso de error
        }
      }, 50);
    },
    resetGraph: () => {
      setNodes([]);
      setEdges([]);
    },
    getGraph: () => ({ nodes: reactFlowInstance.current ? reactFlowInstance.current.getNodes() : [], edges: reactFlowInstance.current ? reactFlowInstance.current.getEdges() : [] }),
  }), [setNodes, setEdges]);

  // Manejar click en nodos
  const handleNodeClick = useCallback((event, node) => {
    if (removeMode) {
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id));
      setRemoveMode(false);
    }
  }, [removeMode, setNodes, setEdges, setRemoveMode]);

  // Manejar click en el canvas vacío
  const handlePaneClick = useCallback(() => {
    if (removeMode) {
      setRemoveMode(false);
    }
  }, [removeMode, setRemoveMode]);

  // Logs para depuración: monitorizar cambios en nodes/edges e instancia
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('GraphCanvas state change -> nodes:', nodes.length, 'edges:', edges.length);
  }, [nodes, edges]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('GraphCanvas reactFlowInstance ready?', !!reactFlowInstance.current);
    if (reactFlowInstance.current) {
      try {
        // eslint-disable-next-line no-console
        console.log('reactFlowInstance nodes count:', reactFlowInstance.current.getNodes().length);
        // eslint-disable-next-line no-console
        console.log('reactFlowInstance edges count:', reactFlowInstance.current.getEdges().length);
        // eslint-disable-next-line no-console
        console.log('reactFlowInstance sample edge:', reactFlowInstance.current.getEdges()[0] ?? null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Error reading from reactFlowInstance', err);
      }
    }
  }, [reactFlowInstance.current]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type: "circle",
        position,
        data: { label: nodes.length + 1 },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, nodes, reactFlowInstance]
  );

  const onConnect = useCallback(
    (params) => {
      if (disableOnConnect) {
        // eslint-disable-next-line no-console
        console.warn('GraphCanvas: onConnect ignored in programmatic mode', params);
        return;
      }
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, disableOnConnect]
  );

  return (
    <div className="graph-canvas-wrapper" ref={reactFlowWrapper}>
      <div 
        className="graph-canvas" 
        style={{ cursor: removeMode ? 'not-allowed' : 'default' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} 
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onInit={(instance) => (reactFlowInstance.current = instance)}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          panOnScroll
          zoomOnPinch
          nodeTypes={nodeTypes}
          nodesDraggable={!removeMode}
          nodesConnectable={!removeMode}
          elementsSelectable={!removeMode}
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
});

GraphCanvas.displayName = "GraphCanvas";
export default GraphCanvas;