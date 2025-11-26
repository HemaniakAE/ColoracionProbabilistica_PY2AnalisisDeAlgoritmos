import { lasVegasColoring } from './lasVegas.js';
import { monteCarloColoring } from './monteCarlo.js';

export class ColoringAlgorithmManager {
    constructor() {
        this.algorithms = {
            'las_vegas': lasVegasColoring,
            'monte_carlo': monteCarloColoring
        };
    }
    
    executeAlgorithm(algorithmName, graph, k, options = {}) {
        const algorithm = this.algorithms[algorithmName];
        
        if (!algorithm) {
            throw new Error(`Algoritmo no encontrado: ${algorithmName}`);
        }
        
        const {
            maxIterations = 1000,
            findValidSolution = false
        } = options;
        
        if (algorithmName === 'las_vegas') {
            return algorithm(graph, k, maxIterations);
        } else {
            return algorithm(graph, k, maxIterations, findValidSolution);
        }
    }
    
    getAvailableAlgorithms() {
        return Object.keys(this.algorithms);
    }
}

export { lasVegasColoring, monteCarloColoring };