import React from 'react';
import { NavLink } from 'react-router-dom';
import '../style/header.css';

const Header = () => {
  return (
    <header className="navbar">
      <div className="navbar-logo">
        <div className="logo-icon">◎</div>
        <h1>TÓNICA</h1>
      </div>
      
      <nav className="navbar-links">
        {/* NavLink agrega automáticamente la clase "active" cuando la ruta coincide */}
        <NavLink to="/" className="nav-pill">
          Home
        </NavLink>
        <NavLink to="/explorar" className="nav-pill">
          Explorar
        </NavLink>
        <NavLink to="/playlist" className="nav-pill">
          Mis mixes
        </NavLink>
      </nav>

      <div className="navbar-profile">
        <div className="profile-circle"></div>
      </div>
    </header>
  );
};

export default Header;