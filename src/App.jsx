import { Routes, Route } from "react-router-dom";
import Lobby from './pages/Lobby/Lobby.jsx'
import ManualExecute from "./pages/ManualExecute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/manual" element={<ManualExecute />} />
    </Routes>
  );
}

export default App;
