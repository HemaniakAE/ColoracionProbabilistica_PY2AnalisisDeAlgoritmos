import { isValidColoring, countConflicts, generateRandomColoring } from './coloringUtils.js';

export function lasVegasColoring(graph, k, maxIterations = 1000) {
    const startTime = performance.now();
    let iterations = 0;
    
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
                    message: `Solución válida encontrada en ${iterations} iteraciones`
                }
            };
        }
    }
    
    const endTime = performance.now();
    const lastColoring = generateRandomColoring(graph, k);
    
    return {
        coloring: lastColoring,
        stats: {
            success: false,
            iterations: iterations,
            execution_time: endTime - startTime,
            conflicts: countConflicts(lastColoring),
            message: `No se encontró solución válida en ${iterations} iteraciones`
        }
    };
}