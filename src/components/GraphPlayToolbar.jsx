import { useState, useEffect } from "react";
import "./GraphPlayToolbar.css";
import { FaPlay } from "react-icons/fa";

const AVAILABLE_COLORS = [
  { value: "blue", label: "🔵 Azul" },
  { value: "green", label: "🟢 Verde" },
  { value: "yellow", label: "🟡 Amarillo" },
  { value: "purple", label: "🟣 Morado" },
  { value: "orange", label: "🟠 Naranja" },
  { value: "cyan", label: "🟦 Cian" },
  { value: "pink", label: "🌸 Rosa" },
  { value: "gray", label: "⚪ Gris" }
];

export default function GraphPlayToolbar() {
  const [colorCount, setColorCount] = useState(3);
  const [selectedColors, setSelectedColors] = useState([
    "blue",
    "purple",
    "yellow"
  ]);
  const [limitHit, setLimitHit] = useState(false);

  // Ajusta selección si colorCount baja
  useEffect(() => {
    if (selectedColors.length > colorCount) {
      setSelectedColors(prev => prev.slice(0, colorCount));
    }
  }, [colorCount]);

  // Resetear el feedback visual después de un momento
  useEffect(() => {
    if (limitHit) {
      const t = setTimeout(() => setLimitHit(false), 600);
      return () => clearTimeout(t);
    }
  }, [limitHit]);

  const handleColorCountChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 3 && value <= 10) {
      setColorCount(value);
    }
  };

  const toggleColor = (value) => {
    // si ya está seleccionado -> deseleccionar
    if (selectedColors.includes(value)) {
      setSelectedColors(prev => prev.filter(c => c !== value));
      return;
    }

    // si no está seleccionado y hay espacio -> añadir
    if (selectedColors.length < colorCount) {
      setSelectedColors(prev => [...prev, value]);
      return;
    }

    // si no hay espacio -> feedback visual (limitHit)
    setLimitHit(true);
  };

  const canPlay = selectedColors.length === colorCount;

  return (
    <div className="graph-play-toolbar">
      <h3>Ejecución</h3>

      <button
        className="play-button"
        disabled={!canPlay}
        aria-disabled={!canPlay}
        title={canPlay ? "Ejecutar algoritmo" : `Selecciona ${colorCount} colores`}
      >
        <FaPlay className="play-icon" />
        <span className="play-text">Ejecutar algoritmo</span>
      </button>

      <div className="color-config">
        <label>Cantidad de colores</label>
        <input
          type="number"
          min={3}
          max={10}
          value={colorCount}
          onChange={handleColorCountChange}
        />
      </div>

      <div className={`color-grid ${limitHit ? "limit-hit" : ""}`}>
        <label>Colores disponibles</label>
        <div className="color-options" role="listbox" aria-multiselectable="true">
          {AVAILABLE_COLORS.map(c => {
            const selected = selectedColors.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                role="option"
                aria-pressed={selected}
                className={`color-option ${c.value} ${selected ? "selected" : ""}`}
                onClick={() => toggleColor(c.value)}
              >
                <span className="color-emoji">{c.label.split(" ")[0]}</span>
                <span className="color-name">{c.label.split(" ").slice(1).join(" ")}</span>
                {selected && <span className="checkmark">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="color-counter">
          {selectedColors.length} / {colorCount}
        </div>
      </div>
    </div>
  );
}
