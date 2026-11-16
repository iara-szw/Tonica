// src/pages/Explorar.jsx
import React, { useState } from 'react';
import '../style/explorar.css'; 

const Explorar = () => {
  // Estado para alternar entre Canciones y Álbumes
  const [filtro, setFiltro] = useState('Canciones');
  
  // Generamos 18 elementos para llenar la grilla como en el diseño[cite: 10]
  const items = Array(18).fill({ titulo: 'Titulo', subtitulo: 'Artista - año' });

  return (
    <div className="explorar-container">
      {/* Header sin botones centrales según el diseño[cite: 10] */}
      <header className="navbar">
        <div className="navbar-logo">
          <div className="logo-icon">◎</div>
          <h1>TÓNICA</h1>
        </div>
        <div className="navbar-profile">
          <div className="profile-circle"></div>
        </div>
      </header>

      <main className="main-content">
        <div className="explorar-header">
          <h2 className="page-main-title">Explorar</h2>
          
          {/* Selector Canciones / Albumes[cite: 10] */}
          <div className="toggle-container">
            <button 
              className={`toggle-btn ${filtro === 'Canciones' ? 'active' : ''}`}
              onClick={() => setFiltro('Canciones')}
            >
              Canciones
            </button>
            <span className="toggle-separator">/</span>
            <button 
              className={`toggle-btn ${filtro === 'Albumes' ? 'active' : ''}`}
              onClick={() => setFiltro('Albumes')}
            >
              Albumes
            </button>
          </div>
        </div>

        <section className="media-section">
          <h3 className="section-title">
            {filtro === 'Canciones' ? 'Canciones para explorar' : 'Albumes para explorar'}
          </h3>
          
          {/* Contenedor blanco con grilla[cite: 10] */}
          <div className="media-grid-container">
            <div className="media-grid">
              {items.map((item, index) => (
                <article key={index} className="media-card">
                  {filtro === 'Canciones' ? (
                    <div className="disc-placeholder">
                      <div className="disc-hole"></div>
                    </div>
                  ) : (
                    <div className="album-placeholder"></div>
                  )}
                  <h4 className="item-title">{item.titulo}</h4>
                  <p className="item-subtitle">{item.subtitulo}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Explorar;