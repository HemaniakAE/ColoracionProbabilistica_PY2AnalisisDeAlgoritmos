import { isValidColoring, countConflicts, generateRandomColoring } from './coloringUtils.js';

/**
 * Algoritmo de coloreo tipo Las Vegas.
 *
 * Las Vegas ≠ Monte Carlo:
 * - Las Vegas: nunca devuelve una solución incorrecta cuando es exitoso. 
 *              Solo devuelve coloraciones válidas (0 conflictos).
 * - Si no se encuentra solución válida dentro del límite, se retorna la mejor encontrada.
 *
 * Modos:
 *  1. findValidSolution = true:
 *      - Intenta encontrar una coloración válida generando coloraciones aleatorias puras.
 *      - Si la encuentra, se detiene inmediatamente.
 *      - Si no, devuelve la mejor aproximación (fallback).
 *
 *  2. findValidSolution = false:
 *      - Ejecuta un número fijo de iteraciones.
 *      - Retorna la mejor solución encontrada o una válida si aparece antes de tiempo.
 *
 * @param {Array} graph - Grafo representado como arreglo de nodos: [nodeId, neighbors[]]
 * @param {number} k - Número de colores disponibles.
 * @param {number} maxIterations - Límite máximo de intentos.
 * @param {boolean} findValidSolution - Activa búsqueda estricta de solución válida.
 * @returns {Object} Coloración final y estadísticas del proceso.
 */
export function lasVegasColoring(graph, k, maxIterations = 1000, findValidSolution = true) {
    const startTime = performance.now();
    let iterations = 0;

    // Guardan la mejor coloración no válida encontrada (por si no hay válido)
    let bestColoring = null;
    let bestConflicts = Infinity;

    // ------------------------------
    // MODO 1: Búsqueda estricta de solución válida (Las Vegas clásico)
    // ------------------------------
    if (findValidSolution) {
        while (iterations < maxIterations) {
            iterations++;

            // Coloración completamente aleatoria
            const randomColoring = generateRandomColoring(graph, k);

            // Las Vegas solo considera éxito si la solución es válida
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

            // Se usa como fallback una mejor coloración no válida
            const conflicts = countConflicts(randomColoring);
            if (conflicts < bestConflicts) {
                bestColoring = randomColoring;
                bestConflicts = conflicts;
            }
        }

        // Si llega aquí, no encontró solución válida en el límite dado
        const endTime = performance.now();
        return {
            coloring: bestColoring || generateRandomColoring(graph, k), // fallback seguro
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

    // ------------------------------
    // MODO 2: Ejecutar un número fijo de iteraciones (no estrictamente Las Vegas)
    // ------------------------------
    else {
        while (iterations < maxIterations) {
            iterations++;

            // Coloración totalmente aleatoria
            const randomColoring = generateRandomColoring(graph, k);
            const conflicts = countConflicts(randomColoring);

            // Actualizar mejor solución encontrada
            if (conflicts < bestConflicts) {
                bestColoring = randomColoring;
                bestConflicts = conflicts;
            }

            // Si se encuentra una solución válida, terminar temprano
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

        // Final del ciclo con número limitado de intentos
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
