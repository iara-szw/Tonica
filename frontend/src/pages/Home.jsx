import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Portada from '../componentes/Portada'
import Header from '../componentes/Header';
import '../style/home.css';

// Lista de términos de búsqueda al azar para dar la sensación de contenido "Random"
const busquedasRandom = ['rock', 'pop', 'indie', 'jazz', 'radiohead', 'queen', 'cerati', 'charly'];

const obtenerTerminoRandom = () => {
  const indice = Math.floor(Math.random() * busquedasRandom.length);
  return busquedasRandom[indice];
};

const Home = () => {
  const navigate = useNavigate();
  const [canciones, setCanciones] = useState([]);
  const [albumes, setAlbumes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarContenidoExplorar = async () => {
      try {
        // 1. Buscar canciones (tracks) aleatorias
        const terminoCanciones = obtenerTerminoRandom();
        const resCanciones = await API.get(`/musica/search?q=${terminoCanciones}&type=track`);
        
        // 2. Buscar álbumes (releases/album) aleatorios
        const terminoAlbumes = obtenerTerminoRandom();
        const resAlbumes = await API.get(`/musica/search?q=${terminoAlbumes}&type=album`);

        // Tomar solo 6 resultados para que coincida con el diseño visual
        setCanciones(resCanciones.data.slice(0, 6));
        setAlbumes(resAlbumes.data.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar contenido de inicio:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarContenidoExplorar();
  }, []);

  const irAlDetalle = (tipo, idExterno) => {
    navigate(`/detalle/${tipo}/${idExterno}`);
  };

  return (
    <div className="home-container">
      <Header />

      <main className="main-content">
        <h2 className="page-main-title">Vos y tu musica</h2>

        {cargando ? (
          <p className="loading-text">Buscando nueva música para ti...</p>
        ) : (
          <>
            {/* Sección: Canciones para explorar */}
            <section className="media-section">
              <h3 className="section-title">Canciones para explorar</h3>
              <div className="media-carousel">
                {canciones.map((item) => (
                  <article 
                    key={`song-${item.id_externo}`} 
                    className="media-card"
                    onClick={() => irAlDetalle('track', item.id_externo)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="disc-placeholder">
                      {item.portada_url ? (
                        <img src={item.portada_url} alt={`Portada de ${item.titulo}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        <div className="disc-hole"></div>
                      )}
                    </div>
                    <h4 className="item-title">{item.titulo}</h4>
                    <p className="item-subtitle">{item.nombre_artista || 'Artista Desconocido'}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Sección: Álbumes para vos */}
            <section className="media-section">
              <h3 className="section-title">Albumes para vos</h3>
              <div className="media-carousel">
                {albumes.map((item) => (
                  <article 
                    key={`album-${item.id_externo}`} 
                    className="media-card"
                    onClick={() => irAlDetalle('album', item.id_externo)}
                    style={{ cursor: 'pointer' }}
                  >
                   <Portada alt="{item.titulo}" tipo="track" url="{item.portada_url}"/>
                    <h4 className="item-title">{item.titulo}</h4>
                    <p className="item-subtitle">{item.nombre_artista || 'Varios Artistas'}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;