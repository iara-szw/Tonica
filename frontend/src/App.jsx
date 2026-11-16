import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'

// Aquí irás importando las demás vistas a medida que las crees
// import Explorar from './pages/Explorar'
// import Detalle from './pages/Detalle'
// import Playlist from './pages/Playlist'
// import Perfil from './pages/Perfil'

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<Home />} />
        
        {/* Rutas futuras preparadas para TÓNICA */}
        {/* <Route path="/explorar" element={<Explorar />} /> */}
        {/* <Route path="/detalle/:id" element={<Detalle />} /> */}
        {/* <Route path="/playlist" element={<Playlist />} /> */}
        {/* <Route path="/perfil" element={<Perfil />} /> */}
      </Routes>
    </Router>
  )
}

export default App