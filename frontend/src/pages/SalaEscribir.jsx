import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, onValue, push, update, get, set } from "firebase/database";
import database from "../firebase";
import "../styles/SalaEscribir.css";
import fondo from "../assets/SalaEscribir.jpg";

const SalaEscribir = () => {
  const { codigoSala: salaId } = useParams();
  const navigate = useNavigate();
  const nombreJugador = sessionStorage.getItem("nombreJugador");
  const { codigoSala } = useParams();

  const [sala, setSala] = useState(null);
  const [palabra, setPalabra] = useState("");
  const [respuestasRestantes, setRespuestasRestantes] = useState(0);
  const [esCreador, setEsCreador] = useState(false);
  const [yaTermine, setYaTermine] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ultimaPalabraEnviada, setUltimaPalabraEnviada] = useState("");

  useEffect(() => {
    const salaRef = ref(database, `salas/${salaId}`);
    const unsub = onValue(salaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSala(data);
        setEsCreador(nombreJugador === data.creador);
        if (!yaTermine && respuestasRestantes === 0 && data.respuestasPorPersona) {
          setRespuestasRestantes(data.respuestasPorPersona);
        }

        if (data.estadoJuego === "jugando") {
          navigate(`/sala/${salaId}/jugar`);
        }
      }
    });

    return () => unsub();
  }, [salaId, nombreJugador, yaTermine, respuestasRestantes, navigate]);

  const handleEnviar = async () => {
    if (enviando || !palabra.trim() || respuestasRestantes <= 0) return;
    if (palabra.trim().toLowerCase() === ultimaPalabraEnviada.toLowerCase()) return;

    setEnviando(true);

    try {
      const palabrasRef = ref(database, `salas/${salaId}/palabras`);
      const nuevaPalabra = {
        palabra: palabra.trim(),
        autor: nombreJugador,
        timestamp: Date.now(),
      };
      await push(palabrasRef, nuevaPalabra);

      const nuevasRestantes = respuestasRestantes - 1;
      setRespuestasRestantes(nuevasRestantes);
      setUltimaPalabraEnviada(palabra.trim());
      setPalabra("");

      if (nuevasRestantes <= 0) setYaTermine(true);
    } catch (error) {
      console.error("Error al enviar palabra:", error);
    } finally {
      setEnviando(false);
    }
  };

  const iniciarRonda = async () => {
    const salaRef = ref(database, `salas/${salaId}`);
    const snapshot = await get(salaRef);
    const salaData = snapshot.val();

    if (!salaData || !salaData.equipos) return;

    const equipos = Object.values(salaData.equipos);
    const primerEquipo = equipos[0];
    if (!primerEquipo) return;

    const jugadorInicial = Object.values(primerEquipo)[0];
    if (!jugadorInicial) return;

    const palabrasRef = ref(database, `salas/${salaId}/palabras`);
    const palabrasSnap = await get(palabrasRef);
    const palabras = palabrasSnap.val();

    if (palabras) {
      await set(ref(database, `salas/${salaId}/palabrasPorActuar`), palabras);
    }

    await update(salaRef, {
      estadoJuego: "jugando",
      jugadorActuando: jugadorInicial,
      turnoActivo: false
    });
  };

  if (!sala) {
    return (
      <div className="sala-escribir-bg" style={{ backgroundImage: `url(${fondo})` }}>
        <h2 className="loading">Cargando sala...</h2>
      </div>
    );
  }

  return (
    <div className="se-bg" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="se-contenido">
        <h1 className="se-instruccion">
          Escribe {respuestasRestantes} {sala.categoria}
        </h1>

        {!yaTermine && (
          <div className="se-input-container">
            <input
              type="text"
              value={palabra}
              onChange={(e) => setPalabra(e.target.value)}
              className="se-input-palabra"
              placeholder="Escribe tu palabra aquí..."
            />
            <button
              onClick={handleEnviar}
              className="se-btn-enviar"
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}

        {yaTermine && <p className="se-instruccion">Esperando a los demás...</p>}

        {esCreador && (
          <div className="se-iniciar-container">
            <button className="se-iniciar-btn" onClick={iniciarRonda}>
              Iniciar ronda
            </button>
          </div>
        )}
      </div>

      <div className="se-codigo">{codigoSala}</div>
      <div className="se-nombre-jugador">{nombreJugador}</div>
    </div>
  );
};

export default SalaEscribir;
