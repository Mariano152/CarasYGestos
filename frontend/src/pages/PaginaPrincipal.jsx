import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PaginaPrincipal.css';
import fondo from '../assets/pagprincipal.jpg'; 

const PaginaPrincipal = () => {
  const navigate = useNavigate();

  return (
    <div
      className="pagina-principal"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
        <h1 className="pagina-title">¡ Caras y Gestos!</h1>

        <div className="pagina-botones">
          <button onClick={() => navigate('/crear-sala')} className="pagina-btn">
            Crear sala
          </button>
          <button onClick={() => navigate('/unirse')} className="pagina-btn">
            Unirse a sala
          </button>
        </div>


    </div>
  );
};

export default PaginaPrincipal;
