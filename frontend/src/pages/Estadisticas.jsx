import React, { useState, useEffect } from 'react';
import './Estadisticas.css';

const Estadisticas = () => {
  // Estado inicial basado en la estructura de /api/estadisticas[cite: 1]
  const [data, setData] = useState({
    minutosEscuchados: 12,
    resenaPromedio: 4.5,
    cancionesGuardadas: 4,
    estados: {
      quieroEscuchar: 1, // Mapea con el estado 'quiero_escuchar'[cite: 1]
      escuchando: 1,     // Mapea con el estado 'escuchando'[cite: 1]
      escuchado: 2       // Mapea con el estado 'escuchado'[cite: 1]
    },
    favoritas: [
      { id: 1, titulo: 'Titulo' },
      { id: 2, titulo: 'Titulo' },
      { id: 3, titulo: 'Titulo' }
    ],
    musica: {
      genero: 'rock',
      artista: 'Queen',
      album: '13',
      cancion: "Don't stop me now"
    }
  });

  /* 
  // Lógica para conectar con el backend real cuando lo integres:
  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const response = await fetch('/api/estadisticas', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas", error);
      }
    };
    fetchEstadisticas();
  }, []);
  */

  return (
    <div className="estadisticas-container">
      <h2 className="estadisticas-title">Mis estadisticas</h2>
      
      <div className="estadisticas-card">
        <div className="estadisticas-header-bar">
          <div className="logo-placeholder">◎ TÓNICA</div>
          <div className="user-avatar-circle"></div>
        </div>

        <div className="estadisticas-content">
          {/* Columna Izquierda: Estadísticas Generales */}
          <div className="estadisticas-column">
            <h3 className="column-subtitle">Estadisticas generales</h3>
            <ul className="stats-list">
              <li>Minutos escuchados: {data.minutosEscuchados}</li>
              <li>Reseña promedio: {data.resenaPromedio}</li>
              <li>Canciones guardadas: {data.cancionesGuardadas}
                <ul className="sub-stats-list">
                  <li>Quiero escuchar: {data.estados.quieroEscuchar}</li>
                  <li>Escuchando: {data.estados.escuchando}</li>
                  <li>Escuchado: {data.estados.escuchado}</li>
                </ul>
              </li>
            </ul>

            <div className="favoritas-section">
              <p>Favoritas:</p>
              <div className="favoritas-box">
                {data.favoritas.map((fav, index) => (
                  <div key={index} className="favorito-item">
                    <div className="vinilo-icon">
                      <div className="vinilo-center"></div>
                    </div>
                    <div className="favorito-info">
                      <span>{fav.titulo}</span>
                      <span className="star-icon">★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tu Música */}
          <div className="estadisticas-column">
            <h3 className="column-subtitle">Tu música</h3>
            <ul className="stats-list">
              <li>Género mas escuchado: {data.musica.genero}</li>
              <li>Artista mas escuchado: {data.musica.artista}</li>
              <li>Album mas escuchado: {data.musica.album}</li>
              <li>Cancion mas escuchada:<br/>{data.musica.cancion}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;