import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, update, get } from "firebase/database";
import database from "../firebase";
import "../styles/SalaJugar.css";
import fondo from "../assets/SalaJugar.jpg";

const SalaJugar = () => {
  const { codigoSala: salaId } = useParams();
  const navigate = useNavigate();
  const nombreJugador = sessionStorage.getItem("nombreJugador");

  const [sala, setSala] = useState(null);
  const [esTurnoMio, setEsTurnoMio] = useState(false);
  const [botonBloqueado, setBotonBloqueado] = useState(false);

  const obtenerEquipoJugador = (equipos, nombre) => {
    if (!equipos) return null;
    for (let [equipo, jugadores] of Object.entries(equipos)) {
      if (Object.values(jugadores).includes(nombre)) return equipo;
    }
    return null;
  };

  useEffect(() => {
    const salaRef = ref(database, `salas/${salaId}`);
    const unsub = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
        setEsTurnoMio(data.jugadorActuando === nombreJugador);

        const equipoJugador = obtenerEquipoJugador(data.equipos, nombreJugador);
        const equipoActor = obtenerEquipoJugador(data.equipos, data.jugadorActuando);

        if (data.estadoJuego === "actuando") {
          if (data.jugadorActuando === nombreJugador) {
            console.log("🎬 Soy el actor, redirigiendo a SalaActuar");
            navigate(`/sala/${salaId}/actuar`);
          } else if (equipoJugador === equipoActor) {
            console.log("🧠 Soy del mismo equipo, redirigiendo a SalaAdivinar");
            navigate(`/sala/${salaId}/adivinar`);
          } else {
            console.log("⏳ No soy del mismo equipo, redirigiendo a SalaEsperar");
            navigate(`/sala/${salaId}/esperar`);
          }
        }
      }
    });
    return () => unsub();
  }, [salaId, nombreJugador, navigate]);

  const iniciarTurno = async () => {
    if (botonBloqueado) return; 
    console.log("🚀 Botón 'Iniciar turno' presionado por", nombreJugador);
    setBotonBloqueado(true); 
    const salaRef = ref(database, `salas/${salaId}`);

    try {
      const snapshot = await get(salaRef);
      const data = snapshot.val();
      if (!data) return;

     
      if (data.turnoActivo || data.estadoJuego === "actuando") {
        console.warn("⏳ Turno ya activo, cancelando inicio duplicado.");
        return;
      }

      const timestamp = Date.now();
      const vecesActuado = data.vecesActuado || {};
      const nuevasVecesActuado = {
        ...vecesActuado,
        [nombreJugador]: (vecesActuado[nombreJugador] || 0) + 1,
      };

      await update(salaRef, {
        estadoJuego: "actuando",
        turnoActivo: true,
        inicioTurno: timestamp,
        vecesActuado: nuevasVecesActuado,
      });

      console.log("✅ Turno iniciado correctamente");

     
      if (data.jugadorActuando === nombreJugador) {
        navigate(`/sala/${salaId}/actuar`);
      }
    } catch (error) {
      console.error("❌ Error al iniciar turno:", error);
    }
  };

  if (!sala) {
    return (
      <div className="sala-jugar-bg" style={{ backgroundImage: `url(${fondo})` }}>
        <h2 className="loading">Cargando sala...</h2>
      </div>
    );
  }

  return (
<div className="sj-bg" style={{ backgroundImage: `url(${fondo})` }}>
  <div className="sj-contenido">
    <h1 className="sj-mensaje-actuar">
      Le toca a <strong>{sala.jugadorActuando}</strong> actuar
    </h1>
    <p className="sj-instruccion">
      Tienen {sala.tiempoPorRonda} segundos para adivinar tantas <strong>{sala.categoria}</strong> como puedan
    </p>
    {esTurnoMio && (
      <button
        className="sj-btn-iniciar"
        onClick={iniciarTurno}
        disabled={botonBloqueado}
      >
        Iniciar turno
      </button>
    )}
  </div>

  <div className="sj-categoria">Categoría: {sala.categoria}</div>

  <div className="sj-puntajes">
    {Object.entries(sala.puntajes || {}).map(([equipo, puntos]) => (
      <div key={equipo} className="sj-equipo">
        <strong>{equipo}</strong>: {puntos} puntos
      </div>
    ))}
  </div>

  <div className="sj-nombre-jugador">{nombreJugador}</div>
  <div className="sj-codigo">{salaId}</div>
</div>

  );
};

export default SalaJugar;
