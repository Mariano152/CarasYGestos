// src/pages/SalaEsperar.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, off } from "firebase/database";
import database from "../firebase";
import "../styles/SalaEsperar.css";
import fondo from "../assets/SalaJugar.jpg";

const SalaEsperar = () => {
  const { codigoSala: salaId } = useParams();
  const navigate = useNavigate();
  const nombreJugador = sessionStorage.getItem("nombreJugador");

  const [sala, setSala] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [jugadorActuando, setJugadorActuando] = useState(null);

  useEffect(() => {
    const salaRef = ref(database, `salas/${salaId}`);
    const unsubscribe = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      console.log("📡 SalaEsperar recibió:", data);
      setSala(data);
      setJugadorActuando(data.jugadorActuando);

      if (data.estadoJuego === "jugando") {
        console.log("🔁 Redirigiendo a SalaJugar...");
        navigate(`/sala/${salaId}/jugar`);
      }
    });

    return () => off(salaRef);
  }, [salaId, navigate]);

  useEffect(() => {
    if (!sala?.inicioTurno || !sala?.tiempoPorRonda) return;

    const intervalo = setInterval(() => {
      const ahora = Date.now();
      const fin = sala.inicioTurno + sala.tiempoPorRonda * 1000;
      const restante = Math.max(0, Math.floor((fin - ahora) / 1000));
      setTiempoRestante(restante);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [sala?.inicioTurno, sala?.tiempoPorRonda]);

  if (!sala) return <div className="sala-esperar-bg" style={{ backgroundImage: `url(${fondo})` }}><h2 className="loading">Cargando...</h2></div>;

  return (
    <div className="sala-esperar-bg" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="contenido">
        <h1 className="mensaje-esperar">{jugadorActuando} está actuando</h1>
        <p className="instruccion-esperar">Espera tu turno...</p>
        {tiempoRestante !== null && (
          <div className="temporizador">{tiempoRestante}s</div>
        )}
      </div>

      <div className="categoria">Categoría: {sala.categoria}</div>

      <div className="puntajes-equipos">
        {sala.equipos &&
          Object.entries(sala.equipos).map(([equipo, jugadores]) => {
            const puntos = (sala.puntajes?.[equipo] || 0);
            return (
              <div key={equipo} className="equipo">
                <strong>{equipo}</strong>: {puntos} puntos
              </div>
            );
          })}
      </div>

      <div className="nombre-jugador">{nombreJugador}</div>
      <div className="codigo-sala-luckiest">{salaId}</div>
    </div>
  );
};

export default SalaEsperar;
