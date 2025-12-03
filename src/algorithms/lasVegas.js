import { isValidColoring, countConflicts, generateRandomColoring } from './coloringUtils.js';

export function lasVegasColoring(graph, k, maxIterations = 1000, findValidSolution = true) {
    const startTime = performance.now();
    let iterations = 0;
    let bestColoring = null;
    let bestConflicts = Infinity;
    
    // MODO 1: Buscar solución válida
    if (findValidSolution) {
        while (iterations < maxIterations) {
            iterations++;
            const randomColoring = generateRandomColoring(graph, k);
            
            if (isValidColoring(randomColoring)) {
                const endTime = performance.now();
                return {
                    coloring: randomColoring,
                    stats: {
                        success: true,
                        iterations: iterations,
                        execution_time: endTime - startTime,
                        conflicts: 0,
                        message: `Solución válida encontrada en ${iterations} iteraciones`,
                        mode: 'find-valid-solution'
                    }
                };
            }
            
            const conflicts = countConflicts(randomColoring);
            if (conflicts < bestConflicts) {
                bestColoring = randomColoring;
                bestConflicts = conflicts;
            }
        }
        
        const endTime = performance.now();
        // Si no encontramos solución válida, retornamos la mejor encontrada (fallback)
        return {
            coloring: bestColoring || generateRandomColoring(graph, k),
            stats: {
                success: false,
                iterations: iterations,
                execution_time: endTime - startTime,
                conflicts: bestConflicts,
                message: `No se encontró solución válida en ${iterations} iteraciones. Se retorna la mejor encontrada (${bestConflicts} conflictos)`,
                mode: 'find-valid-solution'
            }
        };
    } 
    // MODO 2: Ejecutar número limitado de iteraciones
    else {
        while (iterations < maxIterations) {
            iterations++;
            const randomColoring = generateRandomColoring(graph, k);
            const conflicts = countConflicts(randomColoring);
            
            if (conflicts < bestConflicts) {
                bestColoring = randomColoring;
                bestConflicts = conflicts;
            }
            
            if (conflicts === 0) {
                const endTime = performance.now();
                return {
                    coloring: randomColoring,
                    stats: {
                        success: true,
                        iterations: iterations,
                        execution_time: endTime - startTime,
                        conflicts: 0,
                        message: `Solución válida encontrada en ${iterations} iteraciones`,
                        mode: 'limited-iterations'
                    }
                };
            }
        }
        
        const endTime = performance.now();
        return {
            coloring: bestColoring || generateRandomColoring(graph, k),
            stats: {
                success: bestConflicts === 0,
                iterations: iterations,
                execution_time: endTime - startTime,
                conflicts: bestConflicts,
                message: bestConflicts === 0 
                    ? `Solución válida encontrada en ${iterations} iteraciones`
                    : `Mejor solución encontrada (${bestConflicts} conflictos) en ${iterations} iteraciones`,
                mode: 'limited-iterations'
            }
        };
    }
}