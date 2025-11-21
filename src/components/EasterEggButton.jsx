import { useState } from "react";
import { LiaQuestionCircleSolid } from "react-icons/lia";
import "./EasterEggButton.css";

export default function EasterEggButton() {
  const [toast, setToast] = useState(null);

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
