// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaginaPrincipal from "./pages/PaginaPrincipal";
import CrearSala from "./pages/CrearSala";
import UnirseSala from "./pages/UnirseSala";
import SalaActiva from "./pages/SalaActiva"; 
import SalaEscribir from "./pages/SalaEscribir";
import SalaJugar from "./pages/SalaJugar"; // ✅ Nuevo import
import SalaActuar from "./pages/SalaActuar";
import SalaEsperar from "./pages/SalaEsperar"; // 👈 importa esta
import SalaAdivinar from "./pages/SalaAdivinar";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaginaPrincipal />} />
        <Route path="/crear-sala" element={<CrearSala />} />
        <Route path="/unirse" element={<UnirseSala />} />
        <Route path="/sala/:codigoSala" element={<SalaActiva />} /> 
        <Route path="/sala/:codigoSala/escribir" element={<SalaEscribir />} />
        <Route path="/sala/:codigoSala/jugar" element={<SalaJugar />} /> 
        <Route path="/sala/:codigoSala/actuar" element={<SalaActuar />} />
        <Route path="/sala/:codigoSala/esperar" element={<SalaEsperar />} /> {/* 👈 esta es la nueva */}
        <Route path="/sala/:codigoSala/adivinar" element={<SalaAdivinar />} />

              </Routes>
    </Router>
  );
}

export default App;
