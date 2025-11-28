import { useNavigate } from "react-router-dom";
import "./HostCard.css";

function HostCard() {
  const navigate = useNavigate();

  return (
    <div className="home-card">
      <h1>Coloración de grafos</h1>

      <div className="home-buttons">
        <button onClick={() => navigate("/manual")}>
          Modo manual
        </button>

        <button>
          Modo automático
        </button>
      </div>
    </div>
  );
}

export default HostCard;
