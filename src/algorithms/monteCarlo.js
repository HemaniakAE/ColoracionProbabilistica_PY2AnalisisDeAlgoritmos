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
                    message: `Solución válida encontrada en ${iterations} iteraciones`,
                    acceptanceProbability: acceptanceProbability,
                    mode: 'find-valid-solution'
                }
            };
        }
        
        const randomValue = Math.random();
        
        const shouldAccept = (conflicts < currentConflicts) || 
                            (randomValue < acceptanceProbability);
        
        if (shouldAccept) {
            currentColoring = randomColoring;
            currentConflicts = conflicts;
            
            if (conflicts < bestConflicts) {
                bestColoring = randomColoring;
                bestConflicts = conflicts;
            }
        }
        
        if (conflicts === 0) {
            bestColoring = randomColoring;
            bestConflicts = 0;
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