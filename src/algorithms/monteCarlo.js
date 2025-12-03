import { countConflicts, generateRandomColoring } from './coloringUtils.js';

export function monteCarloColoring(
    graph, 
    k, 
    maxIterations = 1000, 
    acceptanceProbability = 0.7,
    findValidSolution = false
) {
    const startTime = performance.now();
    
    let bestColoring = generateRandomColoring(graph, k);
    let bestConflicts = countConflicts(bestColoring);
    
    let currentColoring = bestColoring;
    let currentConflicts = bestConflicts;
    
    for (let iterations = 1; iterations <= maxIterations; iterations++) {
        let randomColoring;
        
        if (findValidSolution) {
            // Búsqueda local: mutar coloración actual
            randomColoring = localSearch(currentColoring, graph, k);
        } else {
            // Coloración completamente aleatoria
            randomColoring = generateRandomColoring(graph, k);
        }
        
        const conflicts = countConflicts(randomColoring);
        
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
        
        // Aceptar si es mejor que la actual
        if (conflicts < currentConflicts) {
            currentColoring = randomColoring;
            currentConflicts = conflicts;
        } else if (conflicts > currentConflicts) {
            // Aceptar solución peor solo con cierta probabilidad
            const randomValue = Math.random();
            if (randomValue < acceptanceProbability) {
                currentColoring = randomColoring;
                currentConflicts = conflicts;
            }
        }
        
        // Actualizar mejor solución encontrada
        if (currentConflicts < bestConflicts) {
            bestColoring = currentColoring;
            bestConflicts = currentConflicts;
        }
    }
    
    const endTime = performance.now();
    
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

// Búsqueda local: mutar un nodo conflictivo
function localSearch(coloring, graph, k) {
    const newColoring = coloring.map(node => [...node]);
    const colorMap = new Map(coloring.map(n => [n[0], n[1]]));
    
    // Encontrar nodo conflictivo
    let conflictingNodes = [];
    for (const [nodeId, color, neighbors] of newColoring) {
        for (const neighborId of neighbors) {
            const neighborColor = colorMap.get(neighborId);
            if (neighborColor === color) {
                conflictingNodes.push(nodeId);
                break;
            }
        }
    }
    
    // Si no hay conflictos, retornar igual
    if (conflictingNodes.length === 0) {
        return newColoring;
    }
    
    // Mutar un nodo conflictivo aleatorio
    const nodeToChange = conflictingNodes[Math.floor(Math.random() * conflictingNodes.length)];
    const nodeIndex = newColoring.findIndex(n => n[0] === nodeToChange);
    
    if (nodeIndex !== -1) {
        const newColor = Math.floor(Math.random() * k);
        newColoring[nodeIndex][1] = newColor;
    }
    
    return newColoring;
}