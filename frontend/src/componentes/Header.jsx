import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import '../style/header.css';

const ENLACES = [
  { to: '/', etiqueta: 'Home', end: true },
  { to: '/explorar', etiqueta: 'Explorar' },
  { to: '/playlist', etiqueta: 'Mis playlists' },
];

const ENLACES_USUARIO = [
  { to: '/perfil', etiqueta: 'Mi perfil' },
  { to: '/biblioteca', etiqueta: 'Mi biblioteca' },
  { to: '/estadisticas', etiqueta: 'Estadísticas' },
];

// null = sin sesión
const leerSesion = () => {
  if (!localStorage.getItem('token')) return null;
  try {
    return JSON.parse(localStorage.getItem('usuario')) ?? {};
  } catch {
    return {};
  }
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState(leerSesion);
  const [navAbierto, setNavAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [avatarFalla, setAvatarFalla] = useState(false);
  const perfilRef = useRef(null);

  // Sesión cambiada desde otra pestaña
  useEffect(() => {
    const sincronizar = () => {
      setUsuario(leerSesion());
      setAvatarFalla(false);
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setNavAbierto(false);
    setMenuAbierto(false);
  }, [location.pathname]);

  // Clic afuera y Escape
  useEffect(() => {
    if (!menuAbierto && !navAbierto) return undefined;

    const alHacerClic = (e) => {
      if (menuAbierto && perfilRef.current && !perfilRef.current.contains(e.target)) {
        setMenuAbierto(false);
      }
    };
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setMenuAbierto(false);
        setNavAbierto(false);
      }
    };

    document.addEventListener('mousedown', alHacerClic);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alHacerClic);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [menuAbierto, navAbierto]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setMenuAbierto(false);
    navigate('/login', { replace: true });
  };

  const nombre = usuario?.nombre_usuario?.trim() || 'Mi cuenta';
  const inicial = usuario?.nombre_usuario?.trim()?.charAt(0)?.toUpperCase() || '♪';

  return (
    <header className="navbar">
      <button
        type="button"
        className={`navbar-burger ${navAbierto ? 'is-open' : ''}`}
        onClick={() => setNavAbierto((v) => !v)}
        aria-label={navAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={navAbierto}
        aria-controls="navbar-links"
      >
        <span />
        <span />
        <span />
      </button>

      <Link to="/" className="navbar-logo" aria-label="Tónica, ir al inicio">
        <span className="logo-icon" aria-hidden="true">◎</span>
        <span className="navbar-brand-text">TÓNICA</span>
      </Link>

      <nav id="navbar-links" className={`navbar-links ${navAbierto ? 'is-open' : ''}`} aria-label="Principal">
        {ENLACES.map((e) => (
          <NavLink
            key={e.to}
            to={e.to}
            end={e.end}
            className="nav-pill"
            onClick={() => setNavAbierto(false)}
          >
            {e.etiqueta}
          </NavLink>
        ))}
      </nav>

      <div className="navbar-profile" ref={perfilRef}>
        {usuario ? (
          <>
            <button
              type="button"
              className="navbar-user"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              aria-label={`Menú de ${nombre}`}
            >
              <span className="navbar-avatar">
                {usuario.avatar_url && !avatarFalla ? (
                  <img src={usuario.avatar_url} alt="" onError={() => setAvatarFalla(true)} />
                ) : (
                  inicial
                )}
              </span>
              <span className="navbar-user-name">{nombre}</span>
              <svg className="navbar-caret" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
                <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {menuAbierto && (
              <div className="navbar-menu" role="menu">
                <div className="navbar-menu-head">
                  <strong>{nombre}</strong>
                  {usuario.correo && <span>{usuario.correo}</span>}
                </div>

                {ENLACES_USUARIO.map((e) => (
                  <Link key={e.to} to={e.to} role="menuitem" onClick={() => setMenuAbierto(false)}>
                    {e.etiqueta}
                  </Link>
                ))}

                <button type="button" role="menuitem" className="navbar-menu-salir" onClick={cerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </>
        ) : (
          <Link to="/login" state={{ from: location }} className="navbar-login">
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;