/**
 * Genera un grafo aleatorio simple (no dirigido) con distribución sin solapamiento
 * Usa el modelo de Erdős–Rényi para la generación de aristas
 * @param {number} nodeCount - Cantidad de nodos a generar
 * @param {number} canvasWidth - Ancho del canvas
 * @param {number} canvasHeight - Alto del canvas 
 * @param {number} edgeProbability - Probabilidad de que exista una arista entre dos nodos (default: 0.15)
 * @returns {Object} - {nodes, edges}
 */
export function generateRandomGraph(
  nodeCount,
  canvasWidth = 2500,
  canvasHeight = 2000,
  edgeProbability = 0.15
) {
  const nodes = [];
  const edges = [];
  const nodeRadius = 20; // Radio del nodo visual
  let minDistance = 80; // Distancia mínima entre centros de nodos
  const padding = 60;

  // Generar posiciones de nodos usando algoritmo de rechazo para evitar solapamiento
  const positions = [];
  let attempts = 0;
  const maxAttempts = nodeCount * 50;

  while (positions.length < nodeCount && attempts < maxAttempts) {
    const x = Math.random() * (canvasWidth - 2 * padding) + padding;
    const y = Math.random() * (canvasHeight - 2 * padding) + padding;

    let tooClose = false;
    for (const pos of positions) {
      const distance = Math.hypot(pos.x - x, pos.y - y);
      if (distance < minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      positions.push({ x, y });
    }
    attempts++;
  }

  // Si no alcanzamos el número de nodos (espacio insuficiente), relajar la distancia y rellenar
  if (positions.length < nodeCount) {
    minDistance = Math.max(20, Math.floor(minDistance / 2));
    while (positions.length < nodeCount) {
      const x = Math.random() * (canvasWidth - 2 * padding) + padding;
      const y = Math.random() * (canvasHeight - 2 * padding) + padding;
      let tooClose = false;
      for (const pos of positions) {
        const distance = Math.hypot(pos.x - x, pos.y - y);
        if (distance < minDistance) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) positions.push({ x, y });
    }
  }

  // Crear nodos
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    nodes.push({
      id: `node_${i}`,
      type: "circle",
      position: { x: pos.x, y: pos.y },
      data: { label: i + 1 },
    });
  }

  // Generar aristas usando modelo de Erdős–Rényi (grafo simple, no dirigido)
  const createdEdges = new Set();
  let edgeId = 0;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.random() < edgeProbability) {
        const edgeKey = `${i}-${j}`;
        if (!createdEdges.has(edgeKey)) {
          edges.push({
            id: `edge_${edgeId}`,
            source: `node_${i}`,
            target: `node_${j}`,
            type: 'default',
            className: 'white-edge',
            style: {
              stroke: '#ffffff',
              strokeWidth: 2,
            },
            animated: false,
          });
          createdEdges.add(edgeKey);
          edgeId++;
        }
      }
    }
  }

  // Si por alguna razón no hay aristas, añadir algunas conexiones mínimas
  if (edges.length === 0) {
    for (let i = 0; i < Math.min(5, nodes.length - 1); i++) {
      const target = Math.floor(Math.random() * (nodes.length - i - 1)) + i + 1;
      edges.push({
        id: `edge_${edgeId}`,
        source: `node_${i}`,
        target: `node_${target}`,
        type: 'default',
        className: 'white-edge',
        style: {
          stroke: '#ffffff',
          strokeWidth: 2,
        },
        animated: false,
      });
      edgeId++;
    }
  }

  return { nodes, edges };
}


/**
 * Convierte el grafo visual a la estructura de datos para los algoritmos de coloreado
 * @param {Array} nodes - Array de nodos de ReactFlow
 * @param {Array} edges - Array de aristas de ReactFlow
 * @returns {Array} - Array de [nodeId, color, neighbors]
 */
export function convertGraphToColoringFormat(nodes, edges) {
  const nodeMap = new Map();
  
  // Inicializar mapa de adyacencia
  for (const node of nodes) {
    nodeMap.set(node.id, { label: node.data.label, neighbors: [] });
  }
  
  // Agregar aristas
  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      nodeMap.get(edge.source).neighbors.push(edge.target);
      nodeMap.get(edge.target).neighbors.push(edge.source);
    }
  }
  
  // Convertir a formato de algoritmo
  return Array.from(nodeMap.entries()).map(([id, data]) => [
    id,
    null, // Color inicial (null)
    data.neighbors,
  ]);
}

/**
 * Genera un grafo con nodos en una cuadrícula ordenada
 * Esto facilita la visualización y verificación de adyacencias
 * @param {number} nodeCount - Cantidad de nodos a generar
 * @param {number} canvasWidth - Ancho del canvas
 * @param {number} canvasHeight - Alto del canvas
 * @param {number} edgeProbability - Probabilidad de que exista una arista entre dos nodos
 * @returns {Object} - {nodes, edges}
 */
export function generateUniformGridGraph(
  nodeCount,
  canvasWidth = 2500,
  canvasHeight = 2000
) {
  const nodes = [];
  const edges = [];

  // Calcular dimensiones de la malla
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const rows = Math.ceil(nodeCount / cols);

  // Espaciado visual
  const padding = 100;
  const cellWidth = (canvasWidth - 2 * padding) / cols;
  const cellHeight = (canvasHeight - 2 * padding) / rows;

  // Crear nodos en grid
  let idCounter = 1;
  const grid = [];

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      if (idCounter > nodeCount) break;

      const x = padding + c * cellWidth + cellWidth / 2;
      const y = padding + r * cellHeight + cellHeight / 2;

      const node = {
        id: String(idCounter),
        type: "circle",
        position: { x, y },
        data: { label: idCounter },
      };

      nodes.push(node);
      grid[r][c] = node.id;
      idCounter++;
    }
  }

  // Crear aristas solo a vecinos cercanos (rectos, ordenados)
  let edgeId = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const current = grid[r][c];
      if (!current) continue;

      // Conectar a la derecha
      if (c + 1 < cols && grid[r][c + 1]) {
        edges.push({
          id: `e-${edgeId++}`,
          source: current,
          target: grid[r][c + 1],
          type: "default",
          className: "white-edge",
          style: { stroke: "#ffffff", strokeWidth: 2 },
          animated: false,
        });
      }

      // Conectar abajo
      if (r + 1 < rows && grid[r + 1][c]) {
        edges.push({
          id: `e-${edgeId++}`,
          source: current,
          target: grid[r + 1][c],
          type: "default",
          className: "white-edge",
          style: { stroke: "#ffffff", strokeWidth: 2 },
          animated: false,
        });
      }
    }
  }

  return { nodes, edges };
}