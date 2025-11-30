import { Routes, Route } from "react-router-dom";
import Lobby from './pages/Lobby/Lobby.jsx'
import ManualExecute from "./pages/ManualMode/ManualExecute.jsx";
import AutomaticMode from "./pages/AutomaticMode/AutomaticExecute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/manual" element={<ManualExecute />} />
      <Route path="/Automatic" element={<AutomaticMode />} />
    </Routes>
  );
}

export default App;
