import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RutaProtegida from './componentes/rutaProtegida';
import Login from './pages/Login';
import Home from './pages/Home';
import Explorar from './pages/Explorar';
import Detalle from './pages/Detalle';
import Playlist from './pages/Playlist';
import Perfil from './pages/Perfil';
import Estadisticas from './pages/Estadisticas';
import PlaylistDetalle from './pages/PlaylistDetalle';
import Biblioteca from './pages/Biblioteca';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/detalle/:type/:id" element={<Detalle />} />
        {/* Rutas protegidas (requieren sesión activa) */}
        <Route element={<RutaProtegida />}>
           <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/Playlist" element={<Playlist />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/playlist/:id" element={<PlaylistDetalle />} />
        <Route path="/perfil" element={<Perfil />} />

        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;