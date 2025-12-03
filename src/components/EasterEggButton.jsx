import { useState } from "react";
import { LiaQuestionCircleSolid } from "react-icons/lia";
import "./EasterEggButton.css";

/**
 * Botón que despliega un mensaje oculto a modo de easter egg.
 *
 * @component
 * @returns {JSX.Element} Un botón interactivo que muestra un toast temporal al ser presionado.
 */
export default function EasterEggButton() {
  const [toast, setToast] = useState(null);

  /**
   * Muestra un mensaje temporal tipo "toast" durante 2.5 segundos.
   *
   * @function
   * @returns {void}
   */
  function showEasterEgg() {
    setToast("Team Bubblesort a la orden");

    setTimeout(() => {
      setToast(null);
    }, 2500);
  }

  return (
    <>
      <button className="easter-egg-button" onClick={showEasterEgg}>
        <div className="easter-egg-logo">
          <LiaQuestionCircleSolid size={48} />
        </div>
      </button>

      {toast && <div className="easter-toast">{toast}</div>}
    </>
  );
}
