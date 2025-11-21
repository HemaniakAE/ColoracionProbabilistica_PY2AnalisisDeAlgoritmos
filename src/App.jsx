import { useState } from "react";
import "./App.css";
import Header from "./components/Header";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Header />
      <div className="card">
        <h2>Card</h2>
      </div>
    </>
  );
}

export default App;
