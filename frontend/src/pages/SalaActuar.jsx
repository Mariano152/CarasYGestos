import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, get, update, onValue, off } from "firebase/database";
import database from "../firebase";
import "../styles/SalaActuar.css";
import fondo from "../assets/SalaJugar.jpg";

const SalaActuar = () => {
  const { codigoSala } = useParams();
  const [palabraActual, setPalabraActual] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [categoria, setCategoria] = useState("");
  const [puntajes, setPuntajes] = useState({});
  const navigate = useNavigate();
  const nombreJugador = sessionStorage.getItem("nombreJugador");

  useEffect(() => {
    const salaRef = ref(database, `salas/${codigoSala}`);
    let intervalo = null;

    const unsub = onValue(salaRef, (snapshot) => {
      const salaData = snapshot.val();
      if (!salaData) return;

      setCategoria(salaData.categoria);
      setPuntajes(salaData.puntajes || {});

      const inicioTurno = salaData.inicioTurno;
      const duracion = salaData.tiempoPorRonda || 60;

      if (!inicioTurno) return;

      const ahora = Date.now();
      const restante = Math.max(0, Math.floor((inicioTurno + duracion * 1000 - ahora) / 1000));
      setTiempoRestante(restante);

      if (intervalo) clearInterval(intervalo);

      intervalo = setInterval(() => {
        const ahora = Date.now();
        const restante = Math.max(0, Math.floor((inicioTurno + duracion * 1000 - ahora) / 1000));
        setTiempoRestante(restante);

        if (restante <= 0) {
          clearInterval(intervalo);
          terminarTurno(salaData); 
        }
      }, 1000);
    });

    return () => {
      if (intervalo) clearInterval(intervalo);
      off(salaRef);
    };
  }, [codigoSala]);

  useEffect(() => {
    const palabraRef = ref(database, `salas/${codigoSala}/palabraActual`);

    const unsub = onValue(palabraRef, (snap) => {
      const palabra = snap.val();
      console.log("📦 palabraActual actualizada en SalaActuar:", palabra);
      setPalabraActual(palabra || "¡SIN PALABRAS!");
    });

    return () => off(palabraRef);
  }, [codigoSala]);

  useEffect(() => {
    const palabraIdRef = ref(database, `salas/${codigoSala}/palabraIdActual`);

    const asignarPalabra = async () => {
      const palabrasRef = ref(database, `salas/${codigoSala}/palabrasPorActuar`);
      const snap = await get(palabrasRef);
      const palabras = snap.val();

      if (palabras) {
        const ids = Object.keys(palabras);
        const id = ids[Math.floor(Math.random() * ids.length)];
        const palabra = palabras[id].palabra;

        await update(ref(database, `salas/${codigoSala}`), {
          palabraActual: palabra,
          palabraIdActual: id,
        });
      } else {
        await update(ref(database, `salas/${codigoSala}`), {
          palabraActual: "¡SIN PALABRAS!",
          palabraIdActual: null,
        });
      }
    };

    const unsub = onValue(palabraIdRef, (snap) => {
      const palabraId = snap.val();
      if (!palabraId) asignarPalabra();
    });

    return () => off(palabraIdRef);
  }, [codigoSala]);

  const terminarTurno = async (salaData) => {
    if (!salaData || !salaData.equipos) return;

    if (nombreJugador !== salaData.jugadorActuando) {
      console.log("⛔ No soy el actor, no termino turno.");
      return;
    }

    const equipos = salaData.equipos;
    const nombresEquipos = Object.keys(equipos);
    const vecesActuado = salaData.vecesActuado || {};

    const equipoActualIndex = nombresEquipos.findIndex((equipo) =>
      Object.values(equipos[equipo]).includes(nombreJugador)
    );
    const siguienteEquipoIndex = (equipoActualIndex + 1) % nombresEquipos.length;
    const siguienteEquipo = nombresEquipos[siguienteEquipoIndex];

    const jugadores = Object.values(equipos[siguienteEquipo]).filter(j => typeof j === "string");

    let siguienteJugador = jugadores[0];
    let minActuaciones = vecesActuado[siguienteJugador] || 0;

    for (let jugador of jugadores) {
      const actuaciones = vecesActuado[jugador] || 0;
      if (actuaciones < minActuaciones) {
        minActuaciones = actuaciones;
        siguienteJugador = jugador;
      }
    }

    await update(ref(database, `salas/${codigoSala}`), {
      estadoJuego: "jugando",
      jugadorActuando: siguienteJugador,
      turnoActivo: false,
      inicioTurno: Date.now(),
      palabraActual: null,
      palabraIdActual: null,
    });

    navigate(`/sala/${codigoSala}/jugar`);
  };

  if (!palabraActual) {
    return (
      <div className="sala-actuar-bg" style={{ backgroundImage: `url(${fondo})` }}>
        <h2 className="loading">Cargando palabra...</h2>
      </div>
    );
  }

  return (
    <div className="sala-actuar-bg" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="categoria">Categoría: {categoria}</div>
      <div className="temporizador">{tiempoRestante}s</div>

      <div className="puntajes-equipos">
        {Object.entries(puntajes).map(([equipo, puntos]) => (
          <div key={equipo} className="equipo">
            <strong>{equipo}</strong>: {puntos} puntos
          </div>
        ))}
      </div>

      <div className="palabra-a-actuar">{palabraActual}</div>
      <div className="nombre-jugador">{nombreJugador}</div>
      <div className="codigo-sala-luckiest">{codigoSala}</div>
    </div>
  );
};

export default SalaActuar;
