import React, { useState, useEffect } from 'react';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/home.css';
import '../style/estadisticas.css';

const ESTADOS = [
  { clave: 'quiero_escuchar', label: 'Quiero escuchar' },
  { clave: 'escuchando', label: 'Escuchando' },
  { clave: 'escuchado', label: 'Escuchado' },
];

// Solo presentación: 135 -> "2 h 15 min"
const formatearTiempo = (min) => {
  if (min < 60) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
};

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
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="home-container estadisticas-page">
        <Header />
        <main className="main-content loading-container">
          <div className="spinner" aria-hidden="true"></div>
          <h2 className="est-loading-title" role="status">Cargando tus estadísticas...</h2>
          <p className="est-loading-hint">Si el servidor estaba dormido, puede tardar un poco.</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container estadisticas-page">
        <Header />
        <main className="main-content">
          <div className="error-box" role="alert">
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Prevenir crasheos si data no está definido
  if (!data) return null;

  const estadisticas = data.estadisticas || {};
  const estadosEscucha = estadisticas.estados_escucha || {};

  // Fallbacks a 0 / '-' aseguran que se muestre algo aunque el backend mande null
  const minutos = estadisticas.tiempo_total_minutos || 0;
  const promedio = Number(estadisticas.promedio_puntuacion) || 0;
  const totalCanciones = estadisticas.total_canciones || 0;
  const genero = estadisticas.genero_predominante || '-';
  const artista = estadisticas.artista_favorito || '-';

  const estrellas = Math.round(promedio);
  const tiempoLargo = formatearTiempo(minutos);
  const totalEstados = ESTADOS.reduce((acc, e) => acc + (Number(estadosEscucha[e.clave]) || 0), 0);

  return (
    <div className="home-container estadisticas-page">
      <Header />

      <main className="main-content">
        <h2 className="page-main-title">Mis estadísticas</h2>

        <div className="estadisticas-card">
          {/* Indicadores principales */}
          <section className="est-tiles" aria-label="Estadísticas generales">
            <article className="est-tile">
              <span className="est-tile-label">Minutos escuchados</span>
              <span className="est-tile-value">{minutos}</span>
              <span className="est-tile-sub">{tiempoLargo || 'minutos en total'}</span>
            </article>

            <article className="est-tile">
              <span className="est-tile-label">Reseña promedio</span>
              <span className="est-tile-value">{promedio || 0}</span>
              <span className="est-stars" role="img" aria-label={`${promedio} de 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={n <= estrellas ? 'est-star on' : 'est-star'}>★</span>
                ))}
              </span>
            </article>

            <article className="est-tile">
              <span className="est-tile-label">Canciones guardadas</span>
              <span className="est-tile-value">{totalCanciones}</span>
              <span className="est-tile-sub">en tu biblioteca</span>
            </article>
          </section>

          <div className="est-columns">
            {/* Estado de escucha */}
            <section className="est-panel">
              <h3 className="est-panel-title">Estado de tu biblioteca</h3>
              <ul className="est-bars">
                {ESTADOS.map(({ clave, label }) => {
                  const n = Number(estadosEscucha[clave]) || 0;
                  const pct = totalEstados ? (n / totalEstados) * 100 : 0;
                  return (
                    <li key={clave} className="est-bar-row">
                      <div className="est-bar-head">
                        <span>{label}</span>
                        <strong>{n}</strong>
                      </div>
                      <div className="est-bar-track" aria-hidden="true">
                        <div className="est-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Tu música */}
            <section className="est-panel">
              <h3 className="est-panel-title">Tu música</h3>
              <ul className="est-fav-list">
                <li className="est-fav">
                  <span className="est-disc" aria-hidden="true" />
                  <div className="est-fav-text">
                    <span className="est-fav-label">Género más escuchado</span>
                    <span className="est-fav-value" title={String(genero)}>{genero}</span>
                  </div>
                </li>
                <li className="est-fav">
                  <span className="est-avatar" aria-hidden="true">
                    {artista !== '-' ? String(artista).charAt(0).toUpperCase() : '·'}
                  </span>
                  <div className="est-fav-text">
                    <span className="est-fav-label">Artista más escuchado</span>
                    <span className="est-fav-value" title={String(artista)}>{artista}</span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Estadisticas;