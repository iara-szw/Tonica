import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/playlist.css';

// Acepta un array directo o { playlists | resultados: [...] }
const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  return data?.playlists ?? data?.resultados ?? data?.items ?? [];
};

const cantidadDe = (mix) =>
  mix.cantidad_items ?? mix.total_items ?? mix.total ?? mix.items?.length ?? null;

const mensajeError = (err, porDefecto) =>
  err.response?.data?.message || err.response?.data?.error || porDefecto;

const SkeletonMixes = () => (
  <ul className="mixes-grid" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, i) => (
      <li key={i} className="mix-card mix-skel-card">
        <div className="mix-skel mix-skel-disc" />
        <div className="mix-skel-text">
          <div className="mix-skel mix-skel-line" />
          <div className="mix-skel mix-skel-line mix-skel-line-short" />
        </div>
      </li>
    ))}
  </ul>
);

const MisMixes = () => {
  const navigate = useNavigate();
  const [mixes, setMixes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const cargarMixes = useCallback(async (signal) => {
    setCargando(true);
    setError(null);
    try {
      const res = await API.get('/playlists', { signal });
      setMixes(normalizarLista(res.data));
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      console.error('Error al cargar los mixes:', err);
      setError(
        mensajeError(
          err,
          'No pudimos cargar tus mixes. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.'
        )
      );
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    cargarMixes(controller.signal);
    return () => controller.abort();
  }, [cargarMixes]);

  const cerrarFormulario = () => {
    setCreando(false);
    setNombre('');
    setDescripcion('');
    setErrorForm(null);
  };

  const crearMix = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorForm('Ponele un nombre a tu mix.');
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      await API.post('/playlists', {
        nombre: nombre.trim(),
        ...(descripcion.trim() && { descripcion: descripcion.trim() }),
      });
      cerrarFormulario();
      await cargarMixes();
    } catch (err) {
      setErrorForm(mensajeError(err, 'No pudimos crear el mix. Probá de nuevo.'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMix = async (mix) => {
    if (!window.confirm(`¿Eliminar "${mix.nombre}"? Las canciones siguen en tu biblioteca.`)) return;
    const anterior = mixes;
    setMixes((lista) => lista.filter((m) => m.id !== mix.id));
    try {
      await API.delete(`/playlists/${mix.id}`);
    } catch (err) {
      setMixes(anterior);
      setError(mensajeError(err, 'No pudimos eliminar el mix. Probá de nuevo.'));
    }
  };

  const irAlMix = (id) => navigate(`/mixes/${id}`);

  return (
    <div className="mixes-container">
      <Header />

      <main className="mixes-main">
        <h2 className="mixes-title">Mis mixes</h2>

        <div className="mixes-toolbar">
          <p className="mixes-count">
            {!cargando && !error && `${mixes.length} ${mixes.length === 1 ? 'mix' : 'mixes'}`}
          </p>
          {!creando && (
            <button type="button" className="mixes-btn" onClick={() => setCreando(true)}>
              + Nuevo mix
            </button>
          )}
        </div>

        {creando && (
          <form className="mixes-form" onSubmit={crearMix}>
            <label htmlFor="mix-nombre">Nombre</label>
            <input
              id="mix-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Para manejar de noche"
              maxLength={80}
              autoFocus
            />

            <label htmlFor="mix-descripcion">Descripción (opcional)</label>
            <textarea
              id="mix-descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={200}
            />

            {errorForm && (
              <p className="mixes-form-error" role="alert">{errorForm}</p>
            )}

            <div className="mixes-form-actions">
              <button type="button" className="mixes-btn mixes-btn-ghost" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="mixes-btn" disabled={guardando}>
                {guardando ? 'Creando...' : 'Crear mix'}
              </button>
            </div>
          </form>
        )}

        <section className="mixes-panel" aria-live="polite">
          {cargando ? (
            <>
              <SkeletonMixes />
              <p className="mixes-loading">Cargando tus mixes... si el servidor estaba dormido puede tardar un poco.</p>
            </>
          ) : error ? (
            <div className="mixes-error" role="alert">
              <p>{error}</p>
              <button type="button" className="mixes-btn" onClick={() => cargarMixes()}>
                Reintentar
              </button>
            </div>
          ) : mixes.length === 0 ? (
            <div className="mixes-empty">
              <p className="mixes-empty-title">Todavía no armaste ningún mix</p>
              <p>Creá uno y sumale canciones desde Explorar o desde el detalle de cada tema.</p>
            </div>
          ) : (
            <ul className="mixes-grid">
              {mixes.map((mix) => {
                const cantidad = cantidadDe(mix);
                return (
                  <li key={mix.id} className="mix-card">
                    <button
                      type="button"
                      className="mix-open"
                      onClick={() => irAlMix(mix.id)}
                      aria-label={`Abrir mix ${mix.nombre}`}
                    >
                      <span className="mix-disc" aria-hidden="true" />
                      <span className="mix-info">
                        <span className="mix-name" title={mix.nombre}>{mix.nombre}</span>
                        {mix.descripcion && <span className="mix-desc">{mix.descripcion}</span>}
                        {cantidad !== null && (
                          <span className="mix-chip">
                            {cantidad} {cantidad === 1 ? 'canción' : 'canciones'}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="mix-delete"
                      onClick={() => eliminarMix(mix)}
                      aria-label={`Eliminar mix ${mix.nombre}`}
                    >
                      Eliminar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default MisMixes;