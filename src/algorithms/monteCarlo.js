import { countConflicts, generateRandomColoring } from './coloringUtils.js';

export function monteCarloColoring(graph, k, maxIterations = 1000, findValidSolution = false) {
    const startTime = performance.now();
    let bestColoring = generateRandomColoring(graph, k);
    let bestConflicts = countConflicts(bestColoring);
    
    for (let iterations = 1; iterations <= maxIterations; iterations++) {
        const randomColoring = generateRandomColoring(graph, k);
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
                    message: `Solución válida encontrada en ${iterations} iteraciones`
                }
            };
        }
        
        if (conflicts < bestConflicts) {
            bestColoring = randomColoring;
            bestConflicts = conflicts;
        }
    }
    
    const endTime = performance.now();
    return {
        coloring: bestColoring,
        stats: {
            success: bestConflicts === 0,
            iterations: maxIterations,
            execution_time: endTime - startTime,
            conflicts: bestConflicts,
            message: bestConflicts === 0 ? 
                "Solución válida encontrada" : 
                `Mejor solución encontrada con ${bestConflicts} conflictos`
        }
    };
}