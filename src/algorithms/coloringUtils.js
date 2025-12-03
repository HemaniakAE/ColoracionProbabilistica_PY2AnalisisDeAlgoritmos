export function isValidColoring(coloredGraph) {
    const colorMap = new Map();
    
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            if (neighborColor === color) {
                return false;
            }
        }
    }
    
    return true;
}

export function countConflicts(coloredGraph) {
    const colorMap = new Map();
    let conflicts = 0;
    const countedPairs = new Set();
    
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            const pairKey = [nodeId, neighborId].sort().join('-');
            
            if (neighborColor === color && !countedPairs.has(pairKey)) {
                conflicts++;
                countedPairs.add(pairKey);
            }
        }
    }
    
    return conflicts;
}

export function generateRandomColoring(graph, k) {
    return graph.map(node => {
        const randomColor = Math.floor(Math.random() * k);
        return [node[0], randomColor, node[2]];
    });
}

/**
 * Identifica todos los pares de nodos que están en conflicto (mismo color, adyacentes)
 * Retorna un Set de identificadores de aristas en formato "source-target" o "target-source"
 */
export function getConflictingEdges(coloredGraph) {
    const colorMap = new Map();
    const conflictingEdges = new Set();
    const processedPairs = new Set();
    
    // Construir mapa de colores
    for (const node of coloredGraph) {
        colorMap.set(String(node[0]), node[1]);
    }
    
    // Identificar pares en conflicto
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        const nodeIdStr = String(nodeId);
        
        for (const neighborId of neighbors) {
            const neighborIdStr = String(neighborId);
            const neighborColor = colorMap.get(neighborIdStr);
            
            // Crear identificador único para la arista (sin importar dirección)
            const pairKey = [nodeIdStr, neighborIdStr].sort().join('-');
            
            // Si ya procesamos este par, saltar
            if (processedPairs.has(pairKey)) {
                continue;
            }
            
            // Si ambos nodos tienen el mismo color, es un conflicto
            if (neighborColor === color) {
                conflictingEdges.add(pairKey);
                processedPairs.add(pairKey);
            }
        }
    }
    
    return conflictingEdges;
}