import { useState } from "react";
import "./Lobby.css";
import HostCard from './HostCard.jsx'
import { PiGraphBold } from "react-icons/pi";

function Lobby() {
  const [removeMode, setRemoveMode] = useState(false);

  return (
    <div className="card">
      {/* Sello esquina */}
      <div className="graph-seal">
        <PiGraphBold size={90} className="graph-seal-icon" />
      </div>

      <HostCard />
    </div>
  );
}

export default Lobby;