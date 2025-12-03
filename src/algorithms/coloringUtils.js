/**
 * Verifica si una coloración es válida.
 *
 * Una coloración es válida si NINGÚN par de nodos adyacentes
 * comparten el mismo color.
 *
 * @param {Array} coloredGraph - Lista de nodos en formato:
 *   [ nodeId, color, neighbors[] ]
 *
 * @returns {boolean} true si no hay conflictos, false de lo contrario.
 */
export function isValidColoring(coloredGraph) {
    const colorMap = new Map();
    
    // Construir mapa de colores para acceso O(1)
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    // Verificar conflictos revisando vecinos
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            
            // Si dos nodos adyacentes tienen el mismo color, NO es válido
            if (neighborColor === color) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Cuenta cuántos conflictos existen en una coloración.
 *
 * Un "conflicto" es un par de nodos adyacentes con el mismo color.
 * Se asegura no contar la misma arista dos veces.
 *
 * @param {Array} coloredGraph - Lista de nodos colorados.
 *
 * @returns {number} cantidad de conflictos encontrados.
 */
export function countConflicts(coloredGraph) {
    const colorMap = new Map();
    let conflicts = 0;
    const countedPairs = new Set(); // Evita duplicados
    
    // Construir mapa para consultas rápidas
    for (const node of coloredGraph) {
        colorMap.set(node[0], node[1]);
    }
    
    // Revisar pares de nodos adyacentes
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);

            // Crear clave única para evitar contar dos veces
            const pairKey = [nodeId, neighborId].sort().join('-');
            
            if (neighborColor === color && !countedPairs.has(pairKey)) {
                conflicts++;
                countedPairs.add(pairKey);
            }
        }
    }
    
    return conflicts;
}

/**
 * Genera una coloración aleatoria válida para cualquier grafo.
 *
 * Asigna a cada nodo un color aleatorio entre 0 y k-1.
 * NO garantiza que la coloración sea válida, solo la genera.
 *
 * @param {Array} graph - Grafo base (sin colores).
 * @param {number} k - Cantidad de colores disponibles.
 *
 * @returns {Array} grafo con colores asignados.
 */
export function generateRandomColoring(graph, k) {
    return graph.map(node => {
        const randomColor = Math.floor(Math.random() * k);
        return [node[0], randomColor, node[2]];
    });
}

/**
 * Obtiene todos los pares de nodos conflictivos en la coloración.
 *
 * Un par conflictivo es una arista cuyos nodos extremos tienen el mismo color.
 *
 * Este método es útil para visualización, porque devuelve un Set de claves
 * tipo "id1-id2", lo cual permite iluminar aristas conflictivas en la UI.
 *
 * @param {Array} coloredGraph - Grafo con colores asignados.
 *
 * @returns {Set<string>} Set con claves de aristas conflictivas.
 */
export function getConflictingEdges(coloredGraph) {
    const colorMap = new Map();
    const conflictingEdges = new Set();
    const processedPairs = new Set();
    
    // Construir mapa de colores para lookup rápido
    for (const node of coloredGraph) {
        colorMap.set(String(node[0]), node[1]);
    }
    
    // Revisar vecinos para detectar conflictos
    for (const node of coloredGraph) {
        const [nodeId, color, neighbors] = node;
        const nodeIdStr = String(nodeId);
        
        for (const neighborId of neighbors) {
            const neighborIdStr = String(neighborId);
            const neighborColor = colorMap.get(neighborIdStr);
            
            // Clave única ordenada (independiente de dirección)
            const pairKey = [nodeIdStr, neighborIdStr].sort().join('-');
            
            // Saltar si ya se procesó
            if (processedPairs.has(pairKey)) {
                continue;
            }
            
            // Conflicto si comparten color
            if (neighborColor === color) {
                conflictingEdges.add(pairKey);
                processedPairs.add(pairKey);
            }
        }
    }
    
    return conflictingEdges;
}
