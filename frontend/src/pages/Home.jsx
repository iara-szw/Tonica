import React from 'react';
import Header from '../componentes/Header'; // Importamos el nuevo componente Header
import '../style/home.css';

const Home = () => {
  // Datos de prueba para simular los elementos del diseño
  const canciones = Array(6).fill({ titulo: 'Titulo', subtitulo: 'Artista - año' });
  const albumes = Array(6).fill({ titulo: 'Titulo', subtitulo: 'Artista - año' });

  return (
    <div className="home-container">
      {/* Reemplazamos todo el bloque <header> viejo por el componente */}
      <Header />

      {/* Contenido Principal */}
      <main className="main-content">
        <h2 className="page-main-title">Vos y tu musica</h2>

        {/* Sección: Canciones para explorar */}
        <section className="media-section">
          <h3 className="section-title">Canciones para explorar</h3>
          <div className="media-carousel">
            {canciones.map((item, index) => (
              <article key={`song-${index}`} className="media-card">
                <div className="disc-placeholder">
                  <div className="disc-hole"></div>
                </div>
                <h4 className="item-title">{item.titulo}</h4>
                <p className="item-subtitle">{item.subtitulo}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Sección: Álbumes para vos */}
        <section className="media-section">
          <h3 className="section-title">Albumes para vos</h3>
          <div className="media-carousel">
            {albumes.map((item, index) => (
              <article key={`album-${index}`} className="media-card">
                <div className="album-placeholder"></div>
                <h4 className="item-title">{item.titulo}</h4>
                <p className="item-subtitle">{item.subtitulo}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;