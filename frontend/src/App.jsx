import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import RutaProtegida from './componentes/rutaProtegida';
// import Login from './pages/Login';
// import Registro from './pages/Registro';
import Home from './pages/Home';
import Explorar from './pages/Explorar';
import Detalle from './pages/Detalle';
// import Biblioteca from './pages/Biblioteca';
// import Playlists from './pages/Playlists';
// import Perfil from './pages/Perfil';
// import Estadisticas from './pages/Estadisticas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        {/* <Route path="/login" element={<Login />} />
        <Route path="/Registro" element={<Registro />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/detalle/:type/:id" element={<Detalle />} /> 

        {/* Rutas protegidas (requieren sesión activa) */}
        {/* <Route element={<RutaProtegida />}>
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
        </Route> */}

        {/* Cualquier ruta desconocida */}
        {/* <Route path="*" element={<Navigate to="/" replace />} />
         */} 
      </Routes>
    </BrowserRouter>
  );
}

export default App;