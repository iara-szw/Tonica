import React, { useState, useEffect } from 'react';
import API from '../api/apiClient'; 
import Header from '../componentes/Header';
import '../style/home.css';
import '../style/estadisticas.css'; 

const Estadisticas = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const response = await API.get('/estadisticas'); 
        setData(response.data);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
        setError("No se pudieron cargar las estadísticas. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <Header />
        <main className="main-content loading-container">
          <h2 className="page-main-title">Cargando tus estadísticas...</h2>
          <div className="spinner"></div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <Header />
        <main className="main-content">
          <div className="error-box">
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Prevenir crasheos si data no está definido
  if (!data) return null;

  return (
    <div className="home-container">
      <Header />

      <main className="main-content">
        <h2 className="page-main-title">Mis estadisticas</h2>
        
        <div className="estadisticas-card">
          
          <div className="estadisticas-content">
            {/* Columna Izquierda: Estadísticas Generales */}
            <div className="estadisticas-column">
              <h3 className="column-subtitle">Estadisticas generales</h3>
              <ul className="stats-list">
                {/* Fallbacks a 0 aseguran que los números se muestren aunque el backend mande null */}
                <li>Minutos escuchados: {data.estadisticas.tiempo_total_minutos || 0}</li>
                <li>Reseña promedio: {data.estadisticas.promedio_puntuacion || 0}</li>
                <li>Canciones guardadas: {data.estadisticas.total_canciones || 0}
                  <ul className="sub-stats-list">
                    <li>Quiero escuchar: {data.estadisticas.estados_escucha.quiero_escuchar || 0}</li>
                    <li>Escuchando: {data.estadisticas.estados_escucha.escuchando || 0}</li>
                    <li>Escuchado: {data.estadisticas.estados_escucha.escuchado || 0}</li>
                  </ul>
                </li>
              </ul>

              <div className="favoritas-section">
                <p>Favoritas:</p>
                <div className="favoritas-box">
                  {/* Se asegura de que exista el array antes de iterarlo */}
                  {data.favoritas && data.favoritas.length > 0 ? (
                    data.favoritas.map((fav, index) => (
                      <div key={fav.id || index} className="favorito-item">
                        <div className="vinilo-icon">
                          <div className="vinilo-center"></div>
                        </div>
                        <div className="favorito-info">
                          <span>{fav.titulo}</span>
                          <span className="star-icon">★</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data-text" style={{margin: 0}}>No tienes canciones favoritas aún.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tu Música */}
            <div className="estadisticas-column">
              <h3 className="column-subtitle">Tu música</h3>
              <ul className="stats-list">
                {/* Fallbacks a guión o texto para strings vacíos */}
                <li>Género mas escuchado: {data.estadisticas.genero_predominante || '-'}</li>
                <li>Artista mas escuchado: {data.estadisticas.artista_favorito || '-'}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Estadisticas;