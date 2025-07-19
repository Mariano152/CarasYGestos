// src/pages/CrearSala.jsx
import React, { useState } from "react";
import database from "../firebase";
import { ref, set, get } from "firebase/database";
import "../styles/CrearSala.css";
import fondo from "../assets/CrearSala.jpg";
import { useNavigate } from "react-router-dom";

const CrearSala = () => {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [respuestasPorPersona, setRespuestasPorPersona] = useState(3);
  const [tiempoPorRonda, setTiempoPorRonda] = useState(60);
  const [numEquipos, setNumEquipos] = useState(2);
  const navigate = useNavigate();

  const generarCodigoSala = () => {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let codigo = "";
    for (let i = 0; i < 6; i++) {
      codigo += letras[Math.floor(Math.random() * letras.length)];
    }
    return codigo;
  };

  const esperarYRedirigir = async (codigoSala) => {
    const salaRef = ref(database, `salas/${codigoSala}`);
    let intentos = 0;
    const maxIntentos = 20;
    const intervalo = 500;

    const intentar = async () => {
      try {
        const snapshot = await get(salaRef);
        const data = snapshot.val();
        intentos++;
        console.log(`🔁 Loop ${intentos}: Datos recibidos:`, data);

        if (data && Object.keys(data).length > 0) {
          console.log("✅ Sala completamente creada, redirigiendo...");
          sessionStorage.setItem("nombreJugador", nombre);
          navigate(`/sala/${codigoSala}`);
        } else if (intentos < maxIntentos) {
          setTimeout(intentar, intervalo);
        } else {
          alert("⏱️ La sala no pudo ser cargada a tiempo. Intenta de nuevo.");
        }
      } catch (error) {
        console.error("❌ Error en el intento", intentos + 1, ":", error);
        alert("Error de conexión. Intenta más tarde.");
      }
    };

    intentar();
  };

  const crearSala = () => {
    if (!nombre.trim()) return alert("Por favor, ingresa tu nombre.");
    if (!categoria.trim()) return alert("Por favor, ingresa una categoría.");
    if (numEquipos < 2) return alert("Debe haber al menos 2 equipos.");
    if (respuestasPorPersona < 1) return alert("Debe haber al menos 1 respuesta por persona.");
    if (tiempoPorRonda < 1) return alert("El tiempo debe ser mayor a 0.");

    const codigoSala = generarCodigoSala();
    const nombreLimpio = nombre.trim();
    const categoriaLimpia = categoria.trim();

    const equipos = {};
    const puntajes = {};
    for (let i = 1; i <= numEquipos; i++) {
      equipos[`Equipo ${i}`] = { __placeholder: true }; // 👈 esto sí se guarda
      puntajes[`Equipo ${i}`] = 0;
    }

    equipos["Equipo 1"][Date.now()] = nombreLimpio;

    const jugadores = {
      [nombreLimpio]: {
        equipo: "Equipo 1",
        esCreador: true,
      },
    };

    const sala = {
      creador: nombreLimpio,
      estado: "esperando",
      categoria: categoriaLimpia,
      respuestasPorPersona,
      tiempoPorRonda,
      equipos,
      puntajes,
      jugadores,
      palabrasPorActuar: [],
    };

    console.log("🧩 Datos a guardar en Firebase:", JSON.stringify(sala, null, 2));

    set(ref(database, `salas/${codigoSala}`), sala)
      .then(() => {
        console.log("✅ Sala creada con código:", codigoSala);
        esperarYRedirigir(codigoSala);
      })
      .catch((error) => alert("❌ Error al guardar sala: " + error.message));
  };

  return (
    <div
      className="crear-sala-bg"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <h1 className="crear-title">Crear sala</h1>

      <div className="crear-form-container">
        <label className="crear-label">Nombre del jugador:</label>
        <input className="crear-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" />

        <label className="crear-label">Temática o categoría:</label>
        <input className="crear-input" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej. Películas" />

        <label className="crear-label">¿Cuántas respuestas por persona?</label>
        <input className="crear-input" type="number" value={respuestasPorPersona} onChange={(e) => setRespuestasPorPersona(+e.target.value)} />

        <label className="crear-label">Tiempo por ronda (en segundos):</label>
        <input className="crear-input" type="number" value={tiempoPorRonda} onChange={(e) => setTiempoPorRonda(+e.target.value)} />

        <label className="crear-label">Número de equipos:</label>
        <input className="crear-input" type="number" value={numEquipos} onChange={(e) => setNumEquipos(+e.target.value)} />

        <button onClick={crearSala} className="crear-btn">Crear sala</button>
      </div>

    </div>
  );
};

export default CrearSala;
