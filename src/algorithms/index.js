import { lasVegasColoring } from "./lasVegas";
import { monteCarloColoring } from "./monteCarlo";

export class ColoringAlgorithmManager {
  constructor() {
    this.algorithms = {
      las_vegas: lasVegasColoring,
      monte_carlo: monteCarloColoring
    };
  }

  executeAlgorithm(name, graph, k, options = {}) {
    const { 
      maxIterations = 1000, 
      findValidSolution = true,
      acceptanceProbability = 0.7
    } = options;

    const algoritmo = this.algorithms[name];
    if (!algoritmo) {
      throw new Error("Algoritmo no encontrado");
    }

    if (name === "las_vegas") {
      return algoritmo(graph, k, maxIterations, findValidSolution);
    } else {
      // Monte Carlo: pasar findValidSolution y acceptanceProbability
      return algoritmo(graph, k, maxIterations, acceptanceProbability, findValidSolution);
    }
  }
}