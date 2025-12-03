import { useMemo } from "react";
import "./StatsChart.css";

export default function StatsChart({ attempts = [], selectedAttemptIndex = null }) {
  // Datos para gráfica de evolución de conflictos
  const conflictEvolutionData = useMemo(() => {
    if (selectedAttemptIndex === null || !attempts[selectedAttemptIndex]) {
      return null;
    }

    const attempt = attempts[selectedAttemptIndex];
    return attempt.conflictsByIteration || [];
  }, [attempts, selectedAttemptIndex]);

  // Datos para gráfica de comparación por k
  const comparisonByK = useMemo(() => {
    const data = {};
    attempts.forEach((att) => {
      const k = att.k || 3;
      if (!data[k]) {
        data[k] = { iterations: [], conflicts: [] };
      }
      if (att.totalIterations) data[k].iterations.push(att.totalIterations);
      if (att.totalConflicts !== undefined) data[k].conflicts.push(att.totalConflicts);
    });
    return data;
  }, [attempts]);

  // Gráfica simple de barras para conflictos vs k
  const renderConflictsByKChart = () => {
    const kValues = Object.keys(comparisonByK).sort((a, b) => Number(a) - Number(b));
    const maxConflicts = Math.max(
      ...Object.values(comparisonByK).map((d) =>
        d.conflicts.length > 0
          ? Math.max(...d.conflicts)
          : 0
      )
    );

    const chartHeight = 250;
    const chartWidth = 400;
    const barWidth = chartWidth / (kValues.length * 1.5);
    const padding = 40;

    return (
      <div className="chart-wrapper">
        <h4>Conflictos Promedio por k</h4>
        <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2} className="chart-svg">
          {/* Ejes */}
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />

          {/* Barras */}
          {kValues.map((k, idx) => {
            const data = comparisonByK[k];
            const avgConflicts =
              data.conflicts.length > 0
                ? data.conflicts.reduce((a, b) => a + b, 0) / data.conflicts.length
                : 0;
            const barHeight = (avgConflicts / maxConflicts) * chartHeight;
            const x = padding + idx * (barWidth + 20);
            const y = chartHeight + padding - barHeight;

            return (
              <g key={k}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#976060ff"
                  opacity="0.8"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + padding + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ffffffff"
                >
                  k={k}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#ffffffff"
                >
                  {avgConflicts.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Etiqueta Y */}
          <text x={15} y={padding - 10} fontSize="12" fill="#666">
            Conflictos
          </text>
        </svg>
      </div>
    );
  };

  // Gráfica de línea para evolución de conflictos en el intento seleccionado
  const renderConflictEvolutionChart = () => {
    if (!conflictEvolutionData || conflictEvolutionData.length === 0) {
      return (
        <div className="chart-wrapper">
          <h4>Evolución de Conflictos por Iteración</h4>
          <p className="chart-placeholder">
            Selecciona un intento para ver la evolución de conflictos
          </p>
        </div>
      );
    }

    const chartHeight = 250;
    const chartWidth = 500;
    const padding = 40;
    const maxConflicts = Math.max(...conflictEvolutionData, 1);
    const pointSpacing = chartWidth / (conflictEvolutionData.length - 1 || 1);

    // Generar puntos de la línea
    let pathData = "";
    conflictEvolutionData.forEach((conflicts, idx) => {
      const x = padding + idx * pointSpacing;
      const y = chartHeight + padding - (conflicts / maxConflicts) * chartHeight;
      pathData += `${x},${y} `;
    });

    return (
      <div className="chart-wrapper">
        <h4>Evolución de Conflictos por Iteración</h4>
        <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2} className="chart-svg">
          {/* Ejes */}
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />

          {/* Línea de datos */}
          <polyline
            points={pathData.trim()}
            fill="none"
            stroke="#e74c3c"
            strokeWidth="2"
          />

          {/* Puntos */}
          {conflictEvolutionData.map((conflicts, idx) => {
            const x = padding + idx * pointSpacing;
            const y = chartHeight + padding - (conflicts / maxConflicts) * chartHeight;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="#ff1900ff"
                opacity="0.7"
              />
            );
          })}

          {/* Etiquetas */}
          <text x={15} y={padding - 10} fontSize="12" fill="#666">
            Conflictos
          </text>
          <text x={chartWidth + padding - 40} y={chartHeight + padding + 25} fontSize="12" fill="#666">
            Iteraciones
          </text>
        </svg>
      </div>
    );
  };

  // Gráfica de distribución de iteraciones por k
  const renderIterationsByKChart = () => {
    const kValues = Object.keys(comparisonByK).sort((a, b) => Number(a) - Number(b));
    const maxIterations = Math.max(
      ...Object.values(comparisonByK).map((d) =>
        d.iterations.length > 0
          ? Math.max(...d.iterations)
          : 0
      )
    );

    const chartHeight = 250;
    const chartWidth = 400;
    const barWidth = chartWidth / (kValues.length * 1.5);
    const padding = 40;

    return (
      <div className="chart-wrapper">
        <h4>Iteraciones Promedio por k</h4>
        <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2} className="chart-svg">
          {/* Ejes */}
          <line
            x1={padding}
            y1={chartHeight + padding}
            x2={chartWidth + padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight + padding}
            stroke="#ccc"
            strokeWidth="2"
          />

          {/* Barras */}
          {kValues.map((k, idx) => {
            const data = comparisonByK[k];
            const avgIterations =
              data.iterations.length > 0
                ? data.iterations.reduce((a, b) => a + b, 0) / data.iterations.length
                : 0;
            const barHeight = (avgIterations / maxIterations) * chartHeight;
            const x = padding + idx * (barWidth + 20);
            const y = chartHeight + padding - barHeight;

            return (
              <g key={k}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#57c9e2ff"
                  opacity="0.8"
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + padding + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ffffffff"
                >
                  k={k}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#ffffffff"
                >
                  {avgIterations.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Etiqueta Y */}
          <text x={15} y={padding - 10} fontSize="12" fill="#666">
            Iteraciones
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="stats-charts">
      <div className="charts-row">
        {renderConflictsByKChart()}
        {renderIterationsByKChart()}
      </div>
      <div className="charts-row full-width">
        {renderConflictEvolutionChart()}
      </div>
    </div>
  );
}
