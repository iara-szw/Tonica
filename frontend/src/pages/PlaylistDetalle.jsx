import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/playlistdetalle.css';

const ETIQUETA = { track: 'Canción', album: 'Álbum', artist: 'Artista' };

// ---------- helpers ----------
// El backend puede guardar el tipo como 'track' o como 'Canción'/'Álbum'/'Artista'
const tipoRuta = (tipo) => {
  const t = String(tipo ?? '').toLowerCase();
  if (t.startsWith('alb') || t.startsWith('álb') || t === 'release-group') return 'album';
  if (t.startsWith('art')) return 'artist';
  return 'track';
};

const idLocalDe = (item) => item.id_cancion ?? item.id ?? null;

const formatoDuracion = (seg) =>
  seg ? `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}` : '';

const duracionTotal = (seg) => {
  if (!seg) return null;
  const min = Math.max(Math.round(seg / 60), 1);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

const fechaLarga = (valor) => {
  const f = new Date(valor);
  if (!valor || Number.isNaN(f.getTime())) return null;
  return f.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Acepta { playlist, canciones } o la playlist con sus canciones adentro
const leerRespuesta = (data) => {
  const pl = data?.playlist ?? data ?? {};
  const items = data?.canciones ?? data?.items ?? pl?.canciones ?? pl?.items ?? pl?.contenido ?? [];
  return { playlist: pl, items: Array.isArray(items) ? items : [] };
};

const mensajeError = (err, porDefecto) => {
  if (err.response) {
    const d = err.response.data;
    return d?.message || d?.error || (typeof d === 'string' && d) || porDefecto;
  }
  if (err.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Probá de nuevo.';
  return 'No pudimos conectar con el servidor. Revisá tu conexión.';
};

// ---------- componentes chicos ----------
const Imagen = ({ src, alt = '' }) => {
  const [falla, setFalla] = useState(false);
  useEffect(() => setFalla(false), [src]);

  if (!src || falla) return <div className="mix-img is-vacio" aria-hidden="true" />;
  return <img className="mix-img" src={src} alt={alt} loading="lazy" onError={() => setFalla(true)} />;
};

const Mosaico = ({ portadas }) => {
  if (portadas.length === 0) {
    return <div className="mix-mosaico is-vinilo" aria-hidden="true" />;
  }
  if (portadas.length === 1) {
    return (
      <div className="mix-mosaico">
        <Imagen src={portadas[0]} />
      </div>
    );
  }
  return (
    <div className="mix-mosaico is-grilla" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="mix-mosaico-celda">
          <Imagen src={portadas[i] ?? null} />
        </div>
      ))}
    </div>
  );
};

// ---------- vista ----------
const PlaylistDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const logueado = !!localStorage.getItem('token');

  const [playlist, setPlaylist] = useState(null);
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [lento, setLento] = useState(false);
  const [error, setError] = useState(null);
  const [reintentos, setReintentos] = useState(0);

  const [quitando, setQuitando] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const avisar = (texto, esError = false) => setAviso({ texto, esError });

  // ----- carga -----
  useEffect(() => {
    if (!logueado) return undefined;
    const controller = new AbortController();
    const avisoLento = setTimeout(() => setLento(true), 5000);

    window.scrollTo(0, 0);
    setCargando(true);
    setLento(false);
    setError(null);
    setPlaylist(null);
    setItems([]);
    setConfirmando(false);

    // FIX: Se cambió /playlists a /playlist
    API.get(`/playlist/${id}`, { signal: controller.signal })
      .then((res) => {
        const { playlist: pl, items: lista } = leerRespuesta(res.data);
        setPlaylist(pl);
        setItems(lista);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        console.error('Error al cargar el mix:', err);
        setError(
          err.response?.status === 404
            ? 'No encontramos este mix.'
            : mensajeError(
                err,
                'No pudimos cargar el mix. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.'
              )
        );
      })
      .finally(() => {
        clearTimeout(avisoLento);
        if (!controller.signal.aborted) {
          setCargando(false);
          setLento(false);
        }
      });

    return () => {
      controller.abort();
      clearTimeout(avisoLento);
    };
  }, [id, logueado, reintentos]);

  // ----- aviso temporal -----
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // ----- Escape cierra el diálogo -----
  useEffect(() => {
    if (!confirmando) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape' && !borrando) setConfirmando(false);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [confirmando, borrando]);

  // ----- derivados -----
  const portadas = useMemo(
    () => [...new Set(items.map((i) => i.portada_url).filter(Boolean))].slice(0, 4),
    [items]
  );

  const resumen = useMemo(() => {
    const total = items.length;
    const todasCanciones = items.every((i) => tipoRuta(i.tipo) === 'track');
    const palabra = todasCanciones
      ? total === 1 ? 'canción' : 'canciones'
      : total === 1 ? 'elemento' : 'elementos';
    const seg = items.reduce((suma, i) => suma + (Number(i.duracion_seg) || 0), 0);
    return { conteo: `${total} ${palabra}`, duracion: duracionTotal(seg) };
  }, [items]);

  // ----- acciones -----
  const quitar = async (item) => {
    const idLocal = idLocalDe(item);
    if (!idLocal) {
      avisar('No pudimos identificar este ítem. Recargá la página.', true);
      return;
    }
    setQuitando(idLocal);
    try {
      // FIX: Se cambió /playlists a /playlist
      await API.delete(`/playlist/${id}/items/${idLocal}`);
      setItems((prev) => prev.filter((x) => idLocalDe(x) !== idLocal));
      avisar(`“${item.titulo}” se quitó del mix.`);
    } catch (err) {
      avisar(mensajeError(err, 'No pudimos quitarlo del mix.'), true);
    } finally {
      setQuitando(null);
    }
  };

  const eliminarMix = async () => {
    setBorrando(true);
    try {
      // FIX: Se cambió /playlists a /playlist
      await API.delete(`/playlist/${id}`);
      navigate('/playlist', { replace: true });
    } catch (err) {
      setBorrando(false);
      setConfirmando(false);
      avisar(mensajeError(err, 'No pudimos eliminar el mix.'), true);
    }
  };

  if (!logueado) return <Navigate to="/login" state={{ from: location }} replace />;

  const creada = fechaLarga(playlist?.fecha_creacion ?? playlist?.created_at ?? playlist?.creado_en);

  // ---------- render ----------
  return (
    <div className="mix-container">
      <Header />

      <main className="mix-main">
        <button type="button" className="mix-volver" onClick={() => navigate('/playlist')}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mis mixes
        </button>

        {error ? (
          <div className="mix-estado" role="alert">
            <p>{error}</p>
            <div className="mix-estado-botones">
              <button type="button" className="mix-btn" onClick={() => setReintentos((n) => n + 1)}>
                Reintentar
              </button>
              <button type="button" className="mix-btn is-outline" onClick={() => navigate('/playlist')}>
                Ir a Mis mixes
              </button>
            </div>
          </div>
        ) : cargando || !playlist ? (
          <>
            <section className="mix-hero" aria-hidden="true">
              <div className="mix-skeleton is-mosaico" />
              <div className="mix-hero-info">
                <div className="mix-skeleton is-linea is-titulo" />
                <div className="mix-skeleton is-linea" />
                <div className="mix-skeleton is-linea is-corta" />
              </div>
            </section>
            {lento && <p className="mix-aviso-lento">El servidor está despertando, puede tardar hasta un minuto...</p>}
          </>
        ) : (
          <>
            <section className="mix-hero">
              <Mosaico portadas={portadas} />

              <div className="mix-hero-info">
                <span className="mix-etiqueta">Mix</span>
                <h1 className="mix-titulo">{playlist.nombre}</h1>

                {playlist.descripcion ? (
                  <p className="mix-descripcion">{playlist.descripcion}</p>
                ) : (
                  <p className="mix-descripcion is-vacia">Sin descripción.</p>
                )}

                <p className="mix-meta">
                  <span>{resumen.conteo}</span>
                  {resumen.duracion && <span>{resumen.duracion}</span>}
                  {creada && <span>Creado el {creada}</span>}
                </p>

                <div className="mix-acciones">
                  <button type="button" className="mix-btn is-claro" onClick={() => navigate('/explorar')}>
                    + Agregar música
                  </button>
                  <button type="button" className="mix-btn is-peligro" onClick={() => setConfirmando(true)}>
                    Eliminar mix
                  </button>
                </div>
              </div>
            </section>

            <section className="mix-seccion" aria-labelledby="mix-lista-titulo">
              <h2 id="mix-lista-titulo" className="mix-seccion-titulo">Contenido</h2>

              <div className="mix-panel">
                {items.length === 0 ? (
                  <div className="mix-vacio">
                    <p>Este mix todavía está vacío.</p>
                    <p className="mix-vacio-ayuda">Explorá música y agregala desde el detalle de cada canción o álbum.</p>
                    <button type="button" className="mix-btn" onClick={() => navigate('/explorar')}>
                      Ir a Explorar
                    </button>
                  </div>
                ) : (
                  <ol className="mix-lista">
                    {items.map((item, i) => {
                      const t = tipoRuta(item.tipo);
                      const idLocal = idLocalDe(item);
                      const ocupado = quitando !== null && quitando === idLocal;

                      return (
                        <li key={idLocal ?? `${item.id_externo}-${i}`} className={`mix-item ${ocupado ? 'is-quitando' : ''}`}>
                          <button
                            type="button"
                            className="mix-item-main"
                            onClick={() => item.id_externo && navigate(`/detalle/${t}/${item.id_externo}`)}
                            disabled={!item.id_externo}
                          >
                            <span className="mix-item-n">{i + 1}</span>
                            <span className={`mix-item-thumb ${t === 'track' ? 'is-disco' : ''}`}>
                              <Imagen src={item.portada_url} alt={`Portada de ${item.titulo}`} />
                            </span>
                            <span className="mix-item-texto">
                              <strong title={item.titulo}>{item.titulo}</strong>
                              <small>{item.nombre_artista || 'Artista desconocido'}</small>
                            </span>
                            <span className="mix-item-tipo">{ETIQUETA[t]}</span>
                            <span className="mix-item-dur">{formatoDuracion(item.duracion_seg)}</span>
                          </button>

                          <button
                            type="button"
                            className="mix-item-quitar"
                            onClick={() => quitar(item)}
                            disabled={quitando !== null}
                            aria-label={`Quitar “${item.titulo}” del mix`}
                            title="Quitar del mix"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ---------- Confirmación de borrado ---------- */}
      {confirmando && playlist && (
        <div className="mix-overlay" onMouseDown={() => !borrando && setConfirmando(false)}>
          <div
            className="mix-dialogo"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mix-dialogo-titulo"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="mix-dialogo-titulo">¿Eliminar este mix?</h2>
            <p>
              Se va a eliminar “{playlist.nombre}”. La música que contiene seguirá en tu biblioteca, pero esta acción no se puede deshacer.
            </p>
            <div className="mix-dialogo-botones">
              <button type="button" className="mix-btn is-outline" onClick={() => setConfirmando(false)} disabled={borrando} autoFocus>
                Cancelar
              </button>
              <button type="button" className="mix-btn is-danger" onClick={eliminarMix} disabled={borrando}>
                {borrando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div className={`mix-toast ${aviso.esError ? 'is-error' : ''}`} role="status" aria-live="polite">
          {aviso.texto}
        </div>
      )}
    </div>
  );
};

export default PlaylistDetalle;