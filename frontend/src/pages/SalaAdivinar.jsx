import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, get, remove, update, off } from "firebase/database";
import database from "../firebase";
import "../styles/SalaAdivinar.css";
import fondo from "../assets/SalaJugar.jpg";

const SalaAdivinar = () => {
  const { codigoSala: salaId } = useParams();
  const navigate = useNavigate();
  const nombreJugador = sessionStorage.getItem("nombreJugador");

  const [sala, setSala] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [inputAdivinar, setInputAdivinar] = useState("");
  const [palabraActual, setPalabraActual] = useState(null);
  const [palabraIdActual, setPalabraIdActual] = useState(null);
  const [resultado, setResultado] = useState("");

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
      if (data) setSala(data);
    });
    return () => off(salaRef);
  }, [salaId]);

  useEffect(() => {
    if (!sala?.inicioTurno || !sala?.tiempoPorRonda) return;

    const intervalo = setInterval(() => {
      const ahora = Date.now();
      const finTurno = sala.inicioTurno + sala.tiempoPorRonda * 1000;
      const restante = Math.max(0, Math.floor((finTurno - ahora) / 1000));
      setTiempoRestante(restante);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [sala?.inicioTurno, sala?.tiempoPorRonda]);

  useEffect(() => {
    if (!sala) return;
    if (sala.estadoJuego === "jugando") {
      console.log("🔄 Volviendo a SalaJugar desde SalaAdivinar");
      navigate(`/sala/${salaId}/jugar`);
    }
  }, [sala, salaId, navigate]);

  useEffect(() => {
    const palabraRef = ref(database, `salas/${salaId}/palabraActual`);
    const idRef = ref(database, `salas/${salaId}/palabraIdActual`);

    const unsub1 = onValue(palabraRef, (snap) => setPalabraActual(snap.val()));
    const unsub2 = onValue(idRef, (snap) => setPalabraIdActual(snap.val()));

    return () => {
      off(palabraRef);
      off(idRef);
    };
  }, [salaId]);

  const handleEnviar = async () => {
    if (!inputAdivinar.trim() || !palabraActual || !palabraIdActual) return;

    const intento = inputAdivinar.trim().toLowerCase().replace(/\s/g, "");
    const palabraRef = palabraActual.toLowerCase().replace(/\s/g, "");
    setInputAdivinar("");

    const mismoEquipo =
      obtenerEquipoJugador(sala.equipos, sala.jugadorActuando) ===
      obtenerEquipoJugador(sala.equipos, nombreJugador);

    if (intento === palabraRef && mismoEquipo) {
      console.log("✅ Palabra adivinada correctamente");

      setResultado(`✅ ${sala.categoria.toUpperCase()} CORRECTA`);

      const equipo = obtenerEquipoJugador(sala.equipos, nombreJugador);
      const nuevosPuntajes = {
        ...(sala.puntajes || {}),
        [equipo]: (sala.puntajes?.[equipo] || 0) + 1,
      };

      await remove(ref(database, `salas/${salaId}/palabrasPorActuar/${palabraIdActual}`));

      const palabrasRef = ref(database, `salas/${salaId}/palabrasPorActuar`);
      const snap = await get(palabrasRef);
      const palabras = snap.val();

      if (palabras) {
        const ids = Object.keys(palabras);
        const nuevaId = ids[Math.floor(Math.random() * ids.length)];
        const nuevaPalabra = palabras[nuevaId].palabra;

        await update(ref(database, `salas/${salaId}`), {
          palabraActual: nuevaPalabra,
          palabraIdActual: nuevaId,
          puntajes: nuevosPuntajes,
        });
      } else {
        await update(ref(database, `salas/${salaId}`), {
          palabraActual: "¡SIN PALABRAS!",
          palabraIdActual: null,
          puntajes: nuevosPuntajes,
        });
      }
    } else {
      console.log("❌ Palabra incorrecta o jugador de otro equipo");
      setResultado(`❌ ${sala.categoria.toUpperCase()} INCORRECTA`);
    }

    setTimeout(() => setResultado(""), 2000);
  };

  if (!sala) return null;

return (
  <div className="sa2-bg" style={{ backgroundImage: `url(${fondo})` }}>
    <div className="sa2-categoria">Categoría: {sala.categoria}</div>
    <div className="sa2-temporizador">{tiempoRestante}s</div>

    <div className="sa2-input-container">
      <input
        type="text"
        value={inputAdivinar}
        onChange={(e) => setInputAdivinar(e.target.value)}
        placeholder="Escribe tu respuesta..."
        className="sa2-input"
      />
      <button className="sa2-btn" onClick={handleEnviar}>Enviar</button>
    </div>

    {resultado && <div className="sa2-resultado">{resultado}</div>}
    <div className="sa2-jugador">{nombreJugador}</div>
    <div className="sa2-codigo">{salaId}</div>

    <div className="sa2-puntajes">
      {Object.entries(sala.puntajes || {}).map(([equipo, puntos]) => (
        <div key={equipo} className="sa2-equipo">
          <strong>{equipo}</strong>: {puntos} puntos
        </div>
      ))}
    </div>
  </div>
);

};

export default SalaAdivinar;
