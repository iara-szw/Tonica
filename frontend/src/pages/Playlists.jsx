import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';

const normalizar = (data) => {
  if (Array.isArray(data)) return data;
  return data?.resultados ?? data?.items ?? data?.mixes ?? data?.playlists ?? [];
};

const Mixes = () => {
  const navigate = useNavigate();
  const [mixes, setMixes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { replace: true, state: { from: '/mixes' } });
      return;
    }

    setCargando(true);
    setError(null);
    try {
      const res = await API.get('/mixes');
      setMixes(normalizar(res.data));
    } catch (err) {
      setError(err.response?.data?.error || 'No pudimos cargar tus mixes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      await API.post('/mixes', { nombre: nombre.trim(), descripcion: descripcion.trim() });
      setNombre('');
      setDescripcion('');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No pudimos crear el mix.');
    }
  };

  const eliminar = async (id) => {
    try {
      await API.delete(`/mixes/${id}`);
      setMixes((actuales) => actuales.filter((mix) => mix.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'No pudimos eliminar el mix.');
    }
  };

  return (
    <div>
      <Header />
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        <h1>Mis mixes</h1>

        <form onSubmit={crear} style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del mix"
            maxLength={100}
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
          />
          <button type="submit">Crear mix</button>
        </form>

        {error && <p role="alert">{error}</p>}
        {cargando ? (
          <p>Cargando mixes...</p>
        ) : mixes.length === 0 ? (
          <p>Todavía no tenés mixes.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {mixes.map((mix) => (
              <article key={mix.id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
                <h2>{mix.nombre}</h2>
                {mix.descripcion && <p>{mix.descripcion}</p>}
                <button type="button" onClick={() => eliminar(mix.id)}>Eliminar mix</button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Mixes;
