// src/pages/SalaActiva.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update, get } from "firebase/database";
import database from "../firebase";
import "../styles/SalaActiva.css";
import fondo from "../assets/SalaActiva.jpg";

const SalaActiva = () => {
  const { codigoSala } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState(null);
  const [nombreJugador, setNombreJugador] = useState(() =>
    sessionStorage.getItem("nombreJugador") || ""
  );
  const [equipoActual, setEquipoActual] = useState(null);

  useEffect(() => {
    if (!codigoSala) return;

    const salaRef = ref(database, `salas/${codigoSala}`);
    const unsubscribe = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📥 Datos de la sala recibidos:", data);
      if (data && Object.keys(data).length > 0) {
        setSala(data);

        if (data.estado === "escribiendo") {
          navigate(`/sala/${codigoSala}/escribir`);
        }
      }
    });

    return () => unsubscribe();
  }, [codigoSala, navigate]);

  useEffect(() => {
    if (!sala || !nombreJugador) return;

    const jugadores = sala.jugadores || {};
    if (jugadores[nombreJugador]) return;

    const equiposObj = sala.equipos || {};
    const equipos = Object.keys(equiposObj);

    if (equipos.length === 0) {
      console.warn("⚠️ No hay equipos en la sala aún, esperando...");
      return;
    }

    const totalJugadores = Object.keys(jugadores).length;
    const equipoAsignado = equipos[totalJugadores % equipos.length];

    if (!equipoAsignado) {
      console.error("❌ No se pudo asignar un equipo.");
      return;
    }

    const jugadorRef = ref(database, `salas/${codigoSala}/jugadores/${nombreJugador}`);
    const equipoRef = ref(database, `salas/${codigoSala}/equipos/${equipoAsignado}`);

    update(jugadorRef, { equipo: equipoAsignado });
    update(equipoRef, { [Date.now()]: nombreJugador });
    setEquipoActual(equipoAsignado);
  }, [sala, nombreJugador]);

  const unirseAEquipo = async (nuevoEquipo) => {
    if (!nombreJugador || !sala || !codigoSala) return;

    const jugadorRef = ref(database, `salas/${codigoSala}/jugadores/${nombreJugador}`);
    const snapshot = await get(jugadorRef);
    const datosJugador = snapshot.val();
    const equipoAnterior = datosJugador?.equipo;

    const equipos = sala.equipos || {};
    for (const equipoNombre in equipos) {
      const equipoData = equipos[equipoNombre];
      for (const clave in equipoData) {
        if (equipoData[clave] === nombreJugador) {
          await update(ref(database, `salas/${codigoSala}/equipos/${equipoNombre}`), {
            [clave]: null,
          });
        }
      }
    }

    const refNuevoEquipo = ref(database, `salas/${codigoSala}/equipos/${nuevoEquipo}`);
    const nuevaClave = Date.now();
    await update(refNuevoEquipo, { [nuevaClave]: nombreJugador });
    await update(jugadorRef, { equipo: nuevoEquipo });

    setEquipoActual(nuevoEquipo);
  };

  const iniciarPartida = async () => {
    const salaRef = ref(database, `salas/${codigoSala}`);
    await update(salaRef, { estado: "escribiendo" });
  };

  if (!sala) {
    return (
      <div className="sala-activa-bg" style={{ backgroundImage: `url(${fondo})` }}>
        <h2 className="loading">Cargando sala...</h2>
      </div>
    );
  }

  const equipos = Object.keys(sala.equipos || {});
  const esCreador = nombreJugador === sala.creador;

return (
  <div className="sa-bg" style={{ backgroundImage: `url(${fondo})` }}>
    {/* Código de sala */}
    <div className="sa-codigo-luckiest">{codigoSala}</div>

    {/* Categoría */}
    <div className="sa-categoria-grande">
      CATEGORÍA: {sala.categoria?.toUpperCase()}
    </div>

    {/* Ícono de engranaje (puedes moverlo si quieres otro lugar) */}
    <div className="sa-header">
      <div className="sa-gear">⚙️</div>
    </div>

    {/* Botón para iniciar partida */}
    {esCreador && (
      <div className="sa-btn-iniciar-container">
        <button onClick={iniciarPartida} className="sa-btn-iniciar">
          Iniciar partida
        </button>
      </div>
    )}

    {/* Lista de equipos */}
    <div className="sa-grid">
      {equipos.map((equipo, index) => (
        <div key={index} className="sa-equipo-box">
          <button onClick={() => unirseAEquipo(equipo)}>+</button>
          <h3>{equipo}</h3>
          <ul>
            {Object.entries(sala.equipos[equipo] || {}).map(([key, jugador]) => {
              if (jugador === true && key === "__placeholder") return null;
              return (
                <li key={key} className={jugador === sala.creador ? "font-bold" : ""}>
                  {jugador} {jugador === sala.creador ? "👑" : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>

    {/* Nombre del jugador (parte inferior derecha) */}
    <div className="sa-nombre-jugador">{nombreJugador}</div>
  </div>
);

};

export default SalaActiva;
