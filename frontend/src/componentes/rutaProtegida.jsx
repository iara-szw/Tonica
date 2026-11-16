import { Navigate, Outlet } from 'react-router-dom';

const RutaProtegida = () => {
  const token = localStorage.getItem('token');

  // Si no hay token, bloquea el acceso y redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, renderiza la ruta hija correspondiente
  return <Outlet />;
};

export default RutaProtegida;