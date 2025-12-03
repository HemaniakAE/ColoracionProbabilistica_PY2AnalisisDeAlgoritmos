import { lasVegasColoring } from "./lasVegas";
import { monteCarloColoring } from "./monteCarlo";

/**
 * Gestor de algoritmos de coloreo.
 *
 * Esta clase centraliza la ejecución de diferentes algoritmos de coloreo,
 * permitiendo seleccionarlos por nombre e invocarlos con parámetros uniformes.
 *
 * Propósito:
 * - Evitar que la UI o el componente que llama tenga que conocer los detalles
 *   específicos de cada algoritmo.
 * - Unificar la firma de los algoritmos para una integración sencilla.
 * - Permitir expansión futura agregando más algoritmos sin modificar llamadas externas.
 */
export class ColoringAlgorithmManager {
  constructor() {
    // Registro interno de algoritmos disponibles.
    // Cada entrada asocia un nombre a una función implementada.
    this.algorithms = {
      las_vegas: lasVegasColoring,
      monte_carlo: monteCarloColoring
    };
  }

  /**
   * Ejecuta un algoritmo de coloreo según su nombre.
   *
   * @param {string} name - Nombre del algoritmo ("las_vegas" o "monte_carlo").
   * @param {Array} graph - Grafo representado como lista de nodos: [nodeId, neighbors[]].
   * @param {number} k - Cantidad de colores disponibles.
   * @param {Object} options - Parámetros opcionales del algoritmo:
   *    - maxIterations: número máximo de iteraciones.
   *    - findValidSolution: modo estricto/búsqueda de validez.
   *    - acceptanceProbability: solo usado por Monte Carlo.
   *
   * @returns {Object} Resultado retornado por el algoritmo seleccionado.
   *
   * @throws {Error} Si el algoritmo solicitado no existe.
   */
  executeAlgorithm(name, graph, k, options = {}) {
    // Parámetros estándar compartidos entre algoritmos
    const { 
      maxIterations = 1000, 
      findValidSolution = true,
      acceptanceProbability = 0.7
    } = options;

    // Seleccionar algoritmo por nombre
    const algoritmo = this.algorithms[name];
    if (!algoritmo) {
      throw new Error("Algoritmo no encontrado");
    }

    // Cada algoritmo tiene su propia firma.
    // Aquí resolvemos compatibilidad para mantener API uniforme.

    if (name === "las_vegas") {
      /**
       * Firma real de Las Vegas:
       *    lasVegasColoring(graph, k, maxIterations, findValidSolution)
       */
      return algoritmo(graph, k, maxIterations, findValidSolution);
    } else {
      /**
       * Firma real de Monte Carlo:
       *    monteCarloColoring(graph, k, maxIterations, acceptanceProbability, findValidSolution)
       */
      return algoritmo(graph, k, maxIterations, acceptanceProbability, findValidSolution);
    }
  }
}
