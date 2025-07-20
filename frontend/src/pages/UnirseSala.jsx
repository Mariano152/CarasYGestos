 // src/pages/UnirseSala.jsx
import React, { useState } from "react";
import "../styles/UnirseSala.css";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import database from "../firebase";
import fondo from "../assets/UnirseSala.jpg"; // Asegúrate que la imagen exista

const UnirseSala = () => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const codigoMayus = codigo.toUpperCase();
    if (!codigoMayus || !nombre.trim()) {
      return alert("Escribe el código de sala y tu nombre");
    }

    const salaRef = ref(database, `salas/${codigoMayus}`);
    const snapshot = await get(salaRef);
    const sala = snapshot.val();

    if (!sala) {
      alert("La sala no existe");
      return;
    }

    const equipos = Object.keys(sala.equipos || {});
    const jugadores = sala.jugadores || {};

    if (jugadores[nombre]) {
      sessionStorage.setItem("nombreJugador", nombre);
      navigate(`/sala/${codigoMayus}`);
      return;
    }

    let conteo = {};
    equipos.forEach((equipo) => {
      conteo[equipo] = sala.equipos[equipo]
        ? Object.keys(sala.equipos[equipo]).length
        : 0;
    });

    const equipoAsignado = equipos.reduce((a, b) =>
      conteo[a] <= conteo[b] ? a : b
    );

    const nuevoJugadorId = Date.now();

    sessionStorage.setItem("nombreJugador", nombre);

    await update(ref(database), {
      [`salas/${codigoMayus}/equipos/${equipoAsignado}/${nuevoJugadorId}`]: nombre,
      [`salas/${codigoMayus}/jugadores/${nombre}`]: {
        equipo: equipoAsignado,
      },
    });

    navigate(`/sala/${codigoMayus}`);
  };

  return (
    <div
      className="us-bg"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.1rem",
      }}
    >
      <h1 className="us-title">Unirse a sala</h1>
      <div className="us-form-container">
        <label className="us-label">Tu nombre:</label>
        <input
          className="us-input"
          placeholder="Nombre del jugador"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label className="us-label">Código de sala:</label>
        <input
          className="us-input"
          placeholder="Código"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />

        <button className="us-btn" onClick={handleJoin}>
          Entrar
        </button>
      </div>
    </div>
  );
};

export default UnirseSala;
