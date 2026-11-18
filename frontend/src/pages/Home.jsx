import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Portada from '../componentes/Portada';
import Header from '../componentes/Header';
import '../style/home.css';

const BUSQUEDAS_RANDOM = ['rock', 'pop', 'indie', 'jazz', 'radiohead', 'queen', 'cerati', 'charly'];
const CANTIDAD = 20;

// Devuelve dos términos distintos
const obtenerTerminosRandom = () => {
  const mezcla = [...BUSQUEDAS_RANDOM].sort(() => Math.random() - 0.5);
  return [mezcla[0], mezcla[1]];
};

// Acepta un array directo o { resultados | results: [...] }
const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  return data?.resultados ?? data?.results ?? [];
};

const SkeletonCarrusel = ({ tipo }) => (
  <div className="media-carousel" aria-hidden="true">
    {Array.from({ length: CANTIDAD }).map((_, i) => (
      <div key={i} className="media-card">
        <div className={`skeleton ${tipo === 'track' ? 'skeleton-disc' : 'skeleton-album'}`} />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-short" />
      </div>
    ))}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [canciones, setCanciones] = useState([]);
  const [albumes, setAlbumes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarContenido = useCallback(async (signal) => {
    setCargando(true);
    setError(null);
    const [terminoCanciones, terminoAlbumes] = obtenerTerminosRandom();

    try {
      const [resCanciones, resAlbumes] = await Promise.all([
        API.get('/musica/search', { params: { q: terminoCanciones, type: 'track' }, signal }),
        API.get('/musica/search', { params: { q: terminoAlbumes, type: 'album' }, signal }),
      ]);

      setCanciones(normalizarLista(resCanciones.data).slice(0, CANTIDAD));
      setAlbumes(normalizarLista(resAlbumes.data).slice(0, CANTIDAD));
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      console.error('Error al cargar contenido de inicio:', err);
      setError(
        err.response?.data?.message ||
          'No pudimos cargar la música. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.'
      );
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    cargarContenido(controller.signal);
    return () => controller.abort();
  }, [cargarContenido]);

  const irAlDetalle = (tipo, idExterno) => navigate(`/detalle/${tipo}/${idExterno}`);

  const onKeyActivar = (e, tipo, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      irAlDetalle(tipo, id);
    }
  };

  const renderVacio = () => <p className="empty-text">No encontramos resultados por ahora.</p>;

  return (
    <div className="home-container">
      <Header />

      <main className="main-content">
        <h2 className="page-main-title">Vos y tu musica</h2>

        {error ? (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button type="button" className="retry-btn" onClick={() => cargarContenido()}>
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Canciones para explorar */}
            <section className="media-section">
              <h3 className="section-title">Canciones para explorar</h3>
              {cargando ? (
                <>
                  <SkeletonCarrusel tipo="track" />
                  <p className="loading-text">Buscando nueva música para vos...</p>
                </>
              ) : canciones.length === 0 ? (
                renderVacio()
              ) : (
                <div className="media-carousel">
                  {canciones.map((item, i) => (
                    <article
                      key={`song-${item.id_externo ?? i}`}
                      className="media-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => irAlDetalle('track', item.id_externo)}
                      onKeyDown={(e) => onKeyActivar(e, 'track', item.id_externo)}
                    >
                      <div className="disc-placeholder">
                        {item.portada_url ? (
                          <img src={item.portada_url} alt={`Portada de ${item.titulo}`} loading="lazy" />
                        ) : (
                          <div className="disc-hole" />
                        )}
                      </div>
                      <h4 className="item-title" title={item.titulo}>{item.titulo}</h4>
                      <p className="item-subtitle">{item.nombre_artista || 'Artista desconocido'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Álbumes para vos */}
            <section className="media-section">
              <h3 className="section-title">Albumes para vos</h3>
              {cargando ? (
                <SkeletonCarrusel tipo="album" />
              ) : albumes.length === 0 ? (
                renderVacio()
              ) : (
                <div className="media-carousel">
                  {albumes.map((item, i) => (
                    <article
                      key={`album-${item.id_externo ?? i}`}
                      className="media-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => irAlDetalle('album', item.id_externo)}
                      onKeyDown={(e) => onKeyActivar(e, 'album', item.id_externo)}
                    >
                      <div className="cover-wrap">
                        <Portada alt={`Portada de ${item.titulo}`} tipo="album" url={item.portada_url} />
                      </div>
                      <h4 className="item-title" title={item.titulo}>{item.titulo}</h4>
                      <p className="item-subtitle">{item.nombre_artista || 'Varios artistas'}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;