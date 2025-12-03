import { useState, useEffect, useMemo } from "react";
import "./AlgorithmStatsPanel.css";
import StatsChart from "./StatsChart";

/**
 * Panel que muestra estadísticas de ejecución de algoritmos de coloración.
 *
 * @param {Object} props
 * @param {Array<Object>} props.attempts - Lista de intentos ejecutados por los algoritmos.
 * @param {number|null} props.selectedAttemptIndex - Índice del intento seleccionado.
 */
export default function AlgorithmStatsPanel({ attempts = [], selectedAttemptIndex = null }) {
  const [stats, setStats] = useState(null);
  const [comparisonData, setComparisonData] = useState({});

  /**
   * Calcula estadísticas globales, agrupadas por k y agrupadas por algoritmo.
   * Se ejecuta cada vez que cambia "attempts".
   */
  useEffect(() => {
    if (!attempts || attempts.length === 0) {
      setStats(null);
      setComparisonData({});
      return;
    }

    // Estadísticas generales
    const totalAttempts = attempts.length;
    const avgExecutionTime =
      attempts.reduce((sum, att) => sum + (att.executionTime || 0), 0) /
      totalAttempts;

    // Contadores agrupados por k
    const successByK = {};
    const totalIterationsByK = {};
    const conflictsByK = {};

    attempts.forEach((att) => {
      const k = att.k || 3;

      if (!successByK[k]) {
        successByK[k] = { total: 0, successful: 0 };
        totalIterationsByK[k] = [];
        conflictsByK[k] = [];
      }

      successByK[k].total += 1;
      if (att.isSuccessful !== false) {
        successByK[k].successful += 1;
      }
      if (att.totalIterations) {
        totalIterationsByK[k].push(att.totalIterations);
      }
      if (att.conflictsByIteration) {
        conflictsByK[k].push(att.conflictsByIteration);
      }
    });

    // Métricas finales agrupadas por k
    const successRates = {};
    const avgIterationsByK = {};
    const avgConflictsByK = {};

    Object.keys(successByK).forEach((k) => {
      const rate = successByK[k];
      successRates[k] = ((rate.successful / rate.total) * 100).toFixed(2);

      if (totalIterationsByK[k].length > 0) {
        avgIterationsByK[k] = (
          totalIterationsByK[k].reduce((a, b) => a + b, 0) /
          totalIterationsByK[k].length
        ).toFixed(2);
      }

      if (conflictsByK[k].length > 0) {
        avgConflictsByK[k] = (
          conflictsByK[k].reduce((a, b) => a + b, 0) /
          conflictsByK[k].length
        ).toFixed(2);
      }
    });

    // Agrupación por algoritmo
    const dataByAlgorithm = {};
    attempts.forEach((att) => {
      const algo = att.algorithm || "Las Vegas";

      if (!dataByAlgorithm[algo]) {
        dataByAlgorithm[algo] = {
          total: 0,
          successful: 0,
          totalIterations: [],
          totalConflicts: [],
          recolorizations: [],
        };
      }

      dataByAlgorithm[algo].total += 1;
      if (att.isSuccessful !== false) {
        dataByAlgorithm[algo].successful += 1;
      }
      if (att.totalIterations) {
        dataByAlgorithm[algo].totalIterations.push(att.totalIterations);
      }
      if (att.totalConflicts) {
        dataByAlgorithm[algo].totalConflicts.push(att.totalConflicts);
      }
      if (att.recolorizations) {
        dataByAlgorithm[algo].recolorizations.push(att.recolorizations);
      }
    });

    const algorithmStats = {};
    Object.keys(dataByAlgorithm).forEach((algo) => {
      const data = dataByAlgorithm[algo];
      algorithmStats[algo] = {
        successRate: ((data.successful / data.total) * 100).toFixed(2),
        avgIterations: (
          data.totalIterations.reduce((a, b) => a + b, 0) /
          (data.totalIterations.length || 1)
        ).toFixed(2),
        avgConflicts: (
          data.totalConflicts.reduce((a, b) => a + b, 0) /
          (data.totalConflicts.length || 1)
        ).toFixed(2),
        avgRecolorizations: (
          data.recolorizations.reduce((a, b) => a + b, 0) /
          (data.recolorizations.length || 1)
        ).toFixed(2),
      };
    });

    setStats({
      totalAttempts,
      avgExecutionTime: avgExecutionTime.toFixed(3),
      successRates,
      avgIterationsByK,
      avgConflictsByK,
      algorithmStats,
    });

    setComparisonData({
      successByK,
      totalIterationsByK,
      conflictsByK,
    });
  }, [attempts]);

  /**
   * Selecciona el intento marcado en la UI.
   *
   * @type {Object|null}
   */
  const selectedAttempt = useMemo(() => {
    if (selectedAttemptIndex !== null && attempts[selectedAttemptIndex]) {
      return attempts[selectedAttemptIndex];
    }
    return null;
  }, [attempts, selectedAttemptIndex]);

  if (!stats) {
    return (
      <div className="algorithm-stats-panel empty">
        <p className="empty-message">
          Ejecuta un algoritmo para ver las estadísticas
        </p>
      </div>
    );
  }

  return (
    <div className="algorithm-stats-panel">

      {/* Sección 1: Estadísticas Generales */}
      <section className="stats-section general-stats">
        <h3>Estadísticas Generales</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total de Intentos</div>
            <div className="stat-value">{stats.totalAttempts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tiempo Promedio (ms)</div>
            <div className="stat-value">{stats.avgExecutionTime}</div>
          </div>
        </div>
      </section>

      {/* Sección 2: Éxito por Algoritmo */}
      {Object.keys(stats.algorithmStats).length > 0 && (
        <section className="stats-section algorithm-stats">
          <h3>Porcentaje de Éxito por Algoritmo</h3>
          <div className="stats-grid">
            {Object.entries(stats.algorithmStats).map(([algo, data]) => (
              <div key={algo} className="stat-card">
                <div className="stat-label">{algo}</div>
                <div className="stat-value">{data.successRate}%</div>
                <div className="stat-detail">
                  Iteraciones: {data.avgIterations}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección 3: Conflictos y Recoloraciones */}
      <section className="stats-section conflicts-stats">
        <h3>Conflictos y Recoloraciones</h3>
        <div className="stats-grid">
          {Object.entries(stats.algorithmStats).map(([algo, data]) => (
            <div key={algo} className="stat-card">
              <div className="stat-label">{algo}</div>
              <div className="stat-detail">
                Conflictos promedio: <strong>{data.avgConflicts}</strong>
              </div>
              <div className="stat-detail">
                Recoloraciones promedio: <strong>{data.avgRecolorizations}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 4: Comparativa por k */}
      {Object.keys(stats.successRates).length > 1 && (
        <section className="stats-section k-comparison">
          <h3>Comparativa por Cantidad de Colores</h3>
          <div className="k-comparison-grid">
            {Object.entries(stats.successRates)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([k, successRate]) => (
                <div key={k} className="k-card">
                  <div className="k-label">k = {k}</div>
                  <div className="k-metric">
                    <span className="metric-name">Éxito:</span>
                    <span className="metric-value">{successRate}%</span>
                  </div>
                  {stats.avgIterationsByK[k] && (
                    <div className="k-metric">
                      <span className="metric-name">Iteraciones:</span>
                      <span className="metric-value">{stats.avgIterationsByK[k]}</span>
                    </div>
                  )}
                  {stats.avgConflictsByK[k] && (
                    <div className="k-metric">
                      <span className="metric-name">Conflictos:</span>
                      <span className="metric-value">{stats.avgConflictsByK[k]}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Sección 5: Intento seleccionado */}
      {selectedAttempt && (
        <section className="stats-section attempt-details">
          <h3>Detalles del Intento #{selectedAttempt.id}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Algoritmo:</span>
              <span className="detail-value">{selectedAttempt.algorithm || "Las Vegas"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Colores (k):</span>
              <span className="detail-value">{selectedAttempt.k}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Iteraciones:</span>
              <span className="detail-value">{selectedAttempt.totalIterations || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Conflictos:</span>
              <span className="detail-value">{selectedAttempt.totalConflicts || 0}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Recoloraciones:</span>
              <span className="detail-value">{selectedAttempt.recolorizations || 0}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className={`detail-value ${selectedAttempt.isSuccessful ? "success" : "pending"}`}>
                {selectedAttempt.isSuccessful ? "✓ Exitoso" : "Pendiente"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Sección 6: Gráficas */}
      {attempts.length > 0 && (
        <section className="stats-section charts-section">
          <h3>Gráficas de Evolución</h3>
          <div className="charts-container">
            <StatsChart attempts={attempts} selectedAttemptIndex={selectedAttemptIndex} />
          </div>
        </section>
      )}
    </div>
  );
}
