import { countConflicts, generateRandomColoring } from './coloringUtils.js';

/**
 * Algoritmo de coloreo usando método Monte Carlo.
 *
 * Puede trabajar en dos modos:
 *  - Modo normal: prueba coloraciones aleatorias y acepta soluciones peores con cierta probabilidad.
 *  - Modo findValidSolution: hace una búsqueda local intentando mejorar la solución e intenta
 *    específicamente encontrar una solución válida (0 conflictos).
 *
 * @param {Array} graph - Grafo en formato de lista de nodos: [nodeId, neighbors[]]
 * @param {number} k - Número de colores disponibles.
 * @param {number} maxIterations - Límite máximo de iteraciones.
 * @param {number} acceptanceProbability - Probabilidad de aceptar soluciones peores.
 * @param {boolean} findValidSolution - Activa la búsqueda local para encontrar solución válida.
 * @returns {Object} Objeto con la coloración final y estadísticas del proceso.
 */
export function monteCarloColoring(
    graph, 
    k, 
    maxIterations = 1000, 
    acceptanceProbability = 0.7,
    findValidSolution = false
) {
    const startTime = performance.now();

    // Coloración inicial completamente aleatoria
    let bestColoring = generateRandomColoring(graph, k);
    let bestConflicts = countConflicts(bestColoring);

    // Estado actual del algoritmo
    let currentColoring = bestColoring;
    let currentConflicts = bestConflicts;

    for (let iterations = 1; iterations <= maxIterations; iterations++) {
        let randomColoring;

        if (findValidSolution) {
            // En modo búsqueda local: mutamos la coloración actual para explorar soluciones cercanas
            randomColoring = localSearch(currentColoring, graph, k);
        } else {
            // En modo aleatorio: generamos una coloración completamente nueva
            randomColoring = generateRandomColoring(graph, k);
        }

        const conflicts = countConflicts(randomColoring);

        // En modo findValidSolution: si encontramos solución perfecta, terminamos temprano
        if (findValidSolution && conflicts === 0) {
            const endTime = performance.now();
            return {
                coloring: randomColoring,
                stats: {
                    success: true,
                    iterations: iterations,
                    execution_time: endTime - startTime,
                    conflicts: 0,
                    message: `Solución válida encontrada en ${iterations} iteraciones`,
                    acceptanceProbability: acceptanceProbability,
                    mode: 'find-valid-solution'
                }
            };
        }

        // --- REGLA DE ACEPTACIÓN ---
        // Aceptamos SI ES MEJOR
        if (conflicts < currentConflicts) {
            currentColoring = randomColoring;
            currentConflicts = conflicts;
        } 
        // Si es peor, la aceptamos solo con cierta probabilidad (típico modelo Monte Carlo)
        else if (conflicts > currentConflicts) {
            const randomValue = Math.random();
            if (randomValue < acceptanceProbability) {
                currentColoring = randomColoring;
                currentConflicts = conflicts;
            }
        }

        // Actualizamos la mejor solución global encontrada
        if (currentConflicts < bestConflicts) {
            bestColoring = currentColoring;
            bestConflicts = currentConflicts;
        }
    }

    const endTime = performance.now();

    // Mensaje final según el modo usado
    let message;
    if (findValidSolution) {
        message = bestConflicts === 0 
            ? "Solución válida encontrada" 
            : `No se encontró solución válida. Mejor solución tiene ${bestConflicts} conflictos`;
    } else {
        message = bestConflicts === 0
            ? `Solución válida encontrada con probabilidad ${acceptanceProbability}`
            : `Mejor solución encontrada con ${bestConflicts} conflictos (probabilidad: ${acceptanceProbability})`;
    }

    return {
        coloring: bestColoring,
        stats: {
            success: bestConflicts === 0,
            iterations: maxIterations,
            execution_time: endTime - startTime,
            conflicts: bestConflicts,
            message: message,
            acceptanceProbability: acceptanceProbability,
            mode: findValidSolution ? 'find-valid-solution' : 'limited-iterations'
        }
    };
}

/**
 * Realiza una mutación local sobre un nodo conflictivo.
 *
 * Estrategia:
 * 1. Se copia la coloración actual.
 * 2. Se detectan los nodos conflictivos (mismo color que un vecino).
 * 3. Si no hay conflictos, se devuelve igual.
 * 4. Si existen, se elige un nodo conflictivo al azar.
 * 5. Ese nodo se recolorea con un color aleatorio entre los k disponibles.
 *
 * Esto permite explorar el vecindario de la solución actual para intentar mejorarla.
 *
 * @param {Array} coloring - Coloración actual: [nodeId, color, neighbors[]]
 * @param {Array} graph - Grafo original.
 * @param {number} k - Número de colores disponibles.
 * @returns {Array} Nueva coloración mutada.
 */
function localSearch(coloring, graph, k) {
    // Copia profunda de la coloración
    const newColoring = coloring.map(node => [...node]);

    // Mapa para consultar colores por ID de nodo
    const colorMap = new Map(coloring.map(n => [n[0], n[1]]));

    let conflictingNodes = [];

    // Buscar nodos que tienen al menos un vecino con el mismo color
    for (const [nodeId, color, neighbors] of newColoring) {
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            if (neighborColor === color) {
                conflictingNodes.push(nodeId);
                break; // Ya sabemos que este nodo tiene conflicto
            }
        }
    }

    // Si no hay conflictos, devolvemos la misma coloración
    if (conflictingNodes.length === 0) {
        return newColoring;
    }

    // Elegimos un nodo conflictivo aleatoriamente para mutarlo
    const nodeToChange = conflictingNodes[Math.floor(Math.random() * conflictingNodes.length)];
    const nodeIndex = newColoring.findIndex(n => n[0] === nodeToChange);

    // Si el nodo existe, le asignamos un nuevo color aleatorio
    if (nodeIndex !== -1) {
        const newColor = Math.floor(Math.random() * k);
        newColoring[nodeIndex][1] = newColor;
    }

    return newColoring;
}
