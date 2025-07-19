// src/pages/UnirseSala.jsx
import React, { useState } from "react";
import "../styles/UnirseSala.css";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import database from "../firebase";

const UnirseSala = () => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    const codigoMayus = codigo.toUpperCase();
    if (!codigoMayus || !nombre) {
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
    <div className="unirse-sala-bg min-h-screen flex flex-col items-center justify-center px-4">
      <div className="form-container w-full max-w-md space-y-4">
        <h2 className="title">Unirse a sala</h2>

        <input
          className="input"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          className="input"
          placeholder="Código de la sala"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />

        <button className="btn" onClick={handleJoin}>
          Entrar
        </button>
      </div>
    </div>
  );
};

export default UnirseSala;
