import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import RutaProtegida from './componentes/rutaProtegida';
import Login from './pages/Login';
import Home from './pages/Home';
import Explorar from './pages/Explorar';
import Detalle from './pages/Detalle';
import Mixes from './pages/Playlists';
// import Biblioteca from './pages/Biblioteca';
 import Perfil from './pages/Perfil';
// import Estadisticas from './pages/Estadisticas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/detalle/:type/:id" element={<Detalle />} />
        <Route path="/perfil" element={<Perfil />} />

        {/* Mis mixes */}
        <Route path="/mixes" element={<Mixes />} />
        <Route path="/playlist" element={<Navigate to="/mixes" replace />} />
        <Route path="/playlists" element={<Navigate to="/mixes" replace />} />

        {/* Rutas protegidas (requieren sesión activa) */}
        {/* <Route element={<RutaProtegida />}>
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
        </Route> */}

        {/* Cualquier ruta desconocida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;