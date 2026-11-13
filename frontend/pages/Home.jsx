import React from 'react';
import './Home.css';

const Home = () => {
  // Datos de prueba para simular los elementos del diseño
  const canciones = Array(6).fill({ titulo: 'Titulo', subtitulo: 'Artista - año' });
  const albumes = Array(6).fill({ titulo: 'Titulo', subtitulo: 'Artista - año' });

  return (
    <div className="home-container">
      {/* Header / Barra de navegación */}
      <header className="navbar">
        <div className="navbar-logo">
          {/* Símbolo de disco improvisado con CSS/texto para el logo */}
          <div className="logo-icon">◎</div> 
          <h1>TÓNICA</h1>
        </div>
        
        <div className="navbar-links">
          <div className="nav-pill"></div>
          <div className="nav-pill"></div>
          <div className="nav-pill"></div>
        </div>

        <div className="navbar-profile">
          <div className="profile-circle"></div>
        </div>
      </header>

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