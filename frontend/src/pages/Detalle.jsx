import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/detalle.css';

const TIPOS = { track: 'Canción', album: 'Álbum', artist: 'Artista' };
const ESTADOS = [
  { valor: 'quiero_escuchar', etiqueta: 'Quiero escuchar' },
  { valor: 'escuchando', etiqueta: 'Escuchando' },
  { valor: 'escuchado', etiqueta: 'Escuchado' },
];
const INIT_BIBLIO = {
  guardado: false,
  idLocal: null,
  interact: { estado: null, es_favorito: false, puntuacion: null, resena: '' },
};
const MAX_RESENA = 500;

// ---------- Helpers ----------
const normalizar = (data) =>
  Array.isArray(data) ? data : (data?.resultados ?? data?.results ?? data?.items ?? data?.playlists ?? []);
const desenvolver = (data) => data?.detalle ?? data?.resultado ?? data;
const getAnio = (fecha) => /^\d{4}/.exec(String(fecha ?? ''))?.[0] ?? null;
const formatoDuracion = (seg) => (seg ? `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}` : null);
const limpiarObjeto = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== ''));

// ---------- Subcomponentes UI ----------
const Imagen = ({ src, alt = '', className = 'detalle-img' }) => {
  const [falla, setFalla] = useState(false);

  // si cambia la imagen (otro detalle), se vuelve a intentar
  useEffect(() => setFalla(false), [src]);

  if (!src || falla) return <div className={`${className} is-vacio`} aria-hidden="true" />;
  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFalla(true)} />;
};

// Canción = círculo (disco) · Álbum = cuadrado · Artista = avatar con inicial
const Visual = ({ tipo, detalle }) => {
  const mostrarPortadaAlbum = tipo === 'track' && detalle.id_album_externo && detalle.portada_url;

  return (
    <div className={tipo === 'track' ? 'detalle-disc' : 'detalle-cover'}>
      <Imagen src={detalle.portada_url} alt={`Portada de ${detalle.titulo}`} />
    </div>
  );
};

const Dato = ({ etiqueta, children }) => (
  <>
    <dt>{etiqueta}</dt>
    <dd>{children}</dd>
  </>
);

const Estrellas = ({ valor, onElegir, deshabilitado }) => {
  const [hover, setHover] = useState(0);
  const activo = hover || valor || 0;
  return (
    <div className="detalle-estrellas" role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          disabled={deshabilitado}
          className={`detalle-estrella ${n <= activo ? 'is-on' : ''}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onElegir(n)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const SeccionCanciones = ({ canciones = [], navigate }) => (
  <section className="detalle-seccion">
    <h2 className="detalle-seccion-titulo">Canciones</h2>
    <div className="detalle-panel">
      {canciones.length ? (
        <ol className="detalle-tracks">
          {canciones.map((c, i) => {
            const tid = c.id_externo || c.id || c.id_cancion;
            return (
              <li key={`${tid}-${i}`}>
                <button type="button" onClick={() => tid && navigate(`/detalle/track/${tid}`)}>
                  <span className="detalle-track-n">{c.posicion ?? i + 1}</span>
                  <span className="detalle-track-t">{c.titulo ?? c.name}</span>
                  <span className="detalle-track-d">{formatoDuracion(c.duracion_seg) ?? ''}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="detalle-vacio">No hay canciones listadas para este álbum.</p>
      )}
    </div>
  </section>
);

const SeccionDiscografia = ({ albumes = [], navigate }) => (
  <section className="detalle-seccion">
    <h2 className="detalle-seccion-titulo">Discografía</h2>
    <div className="detalle-panel">
      {albumes.length ? (
        <div className="detalle-grid">
          {albumes.map((a, i) => {
            const aid = a.id_album_externo || a.id_externo || a.id;
            return (
              <button
                key={`${aid}-${i}`}
                type="button"
                className="detalle-mini"
                onClick={() => aid && navigate(`/detalle/album/${aid}`)}
              >
                <div className="detalle-mini-cover">
                  <Imagen src={a.portada_url} alt={`Portada de ${a.titulo}`} />
                </div>
                <h3 title={a.titulo}>{a.titulo}</h3>
                <p>{[a.tipo, getAnio(a.fecha)].filter(Boolean).join(' - ')}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="detalle-vacio">No encontramos álbumes de este artista.</p>
      )}
    </div>
  </section>
);

// ---------- Componente principal ----------
const Detalle = () => {
  const params = useParams();
  const tipo = (params.tipo ?? params.type ?? '').toLowerCase();
  const id = params.id;
  const navigate = useNavigate();
  const location = useLocation();
  const logueado = !!localStorage.getItem('token');

  const [data, setData] = useState({ detalle: null, albumInfo: null, cargando: true, error: null });
  const [lento, setLento] = useState(false);
  const [reintentos, setReintentos] = useState(0);
  const [biblio, setBiblio] = useState(INIT_BIBLIO);
  const [ui, setUi] = useState({ ocupado: false, editando: false, borrador: '', menuAbierto: false, aviso: null });
  const [playlists, setPlaylists] = useState(null);
  const menuRef = useRef(null);

  const setUiCampos = (campos) => setUi((p) => ({ ...p, ...campos }));
  const avisar = (texto, esError = false) => setUiCampos({ aviso: { texto, esError } });

  const { detalle, albumInfo, cargando, error } = data;
  const idExterno = detalle?.id_externo ?? id;
  const detalleVisual = tipo === 'track'
    ? { ...detalle, portada_url: detalle?.portada_url }
    : detalle;

  // --- Carga del detalle ---
  useEffect(() => {
    if (!TIPOS[tipo]) {
      setData({ detalle: null, albumInfo: null, cargando: false, error: 'El tipo de contenido no es válido.' });
      return undefined;
    }

    const controller = new AbortController();
    const avisoLento = setTimeout(() => setLento(true), 5000);

    window.scrollTo(0, 0);
    setLento(false);
    setData({ detalle: null, albumInfo: null, cargando: true, error: null });
    setUi((p) => ({ ...p, editando: false, menuAbierto: false }));

    API.get(`/musica/detalle/${tipo}/${id}`, { signal: controller.signal })
      .then((res) => {
        const detApi = desenvolver(res.data);
        const itemPortada = location.state?.itemPortada;
        const det = tipo === 'track' && itemPortada
          ? {
              ...detApi,
              nombre_album: detApi.nombre_album || itemPortada.nombre_album,
              portada_url: itemPortada.portada_url || detApi.portada_url
            }
          : detApi;
        setData((prev) => ({ ...prev, detalle: det, cargando: false }));

        // Álbum de la canción: si falla, el detalle igual se muestra
        if (tipo === 'track' && det?.id_album_externo) {
          API.get(`/musica/detalle/album/${det.id_album_externo}`, { signal: controller.signal })
            .then((r) => setData((prev) => ({ ...prev, albumInfo: desenvolver(r.data) })))
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        console.error('Error al cargar el detalle:', err);
        setData({
          detalle: null,
          albumInfo: null,
          cargando: false,
          error:
            err.response?.status === 404
              ? 'No encontramos este contenido.'
              : err.response?.data?.message ||
                'No pudimos cargar el detalle. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.',
        });
      })
      .finally(() => {
        clearTimeout(avisoLento);
        if (!controller.signal.aborted) setLento(false);
      });

    return () => {
      controller.abort();
      clearTimeout(avisoLento);
    };
  }, [tipo, id, reintentos]);

  // --- Biblioteca ---
  const cargarBiblioteca = useCallback(
    async (idBuscado, signal) => {
      if (!logueado || !idBuscado) return;
      try {
        const res = await API.get('/biblioteca', { signal });
        const item = normalizar(res.data).find((i) => i.id_externo === idBuscado);
        setBiblio(
          item
            ? {
                guardado: true,
                idLocal: item.id_cancion ?? item.id ?? null,
                interact: {
                  estado: item.estado ?? null,
                  es_favorito: !!item.es_favorito,
                  puntuacion: item.puntuacion ?? null,
                  resena: item.resena ?? '',
                },
              }
            : INIT_BIBLIO
        );
      } catch (err) {
        if (err.code !== 'ERR_CANCELED') console.error('Error al leer la biblioteca:', err);
      }
    },
    [logueado]
  );

  useEffect(() => {
    if (!detalle?.id_externo) return undefined;
    setBiblio(INIT_BIBLIO);
    const controller = new AbortController();
    cargarBiblioteca(detalle.id_externo, controller.signal);
    return () => controller.abort();
  }, [detalle?.id_externo, cargarBiblioteca]);

  // --- Avisos y menú ---
  useEffect(() => {
    if (!ui.aviso) return undefined;
    const t = setTimeout(() => setUi((p) => ({ ...p, aviso: null })), 3500);
    return () => clearTimeout(t);
  }, [ui.aviso]);

  useEffect(() => {
    if (!ui.menuAbierto) return undefined;
    const cerrar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUi((p) => ({ ...p, menuAbierto: false }));
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [ui.menuAbierto]);

  // --- Acciones ---
  const checkAuth = () => {
    if (!logueado) {
      navigate('/login', { state: { from: location } });
      return false;
    }
    return true;
  };

  // Guarda cambios en la biblioteca (crea el ítem si no existía). Devuelve true/false.
  const guardar = async (cambios = {}, mensaje = null) => {
    if (!checkAuth()) return false;

    const previa = biblio;
    const nueva = { ...biblio.interact, estado: biblio.interact.estado ?? 'quiero_escuchar', ...cambios };

    setBiblio((b) => ({ ...b, guardado: true, interact: nueva })); // optimista
    setUiCampos({ ocupado: true });
    try {
      await API.post('/biblioteca', { id_externo: idExterno, tipo, interact: limpiarObjeto(nueva) });
      await cargarBiblioteca(idExterno);
      if (mensaje) avisar(mensaje);
      return true;
    } catch (err) {
      setBiblio(previa);
      avisar(err.response?.data?.message || 'No pudimos guardar los cambios.', true);
      return false;
    } finally {
      setUiCampos({ ocupado: false });
    }
  };

  const quitarDeBiblioteca = async () => {
    if (!biblio.idLocal) {
      avisar('No pudimos identificar este ítem en tu biblioteca. Recargá la página.', true);
      return;
    }
    setUiCampos({ ocupado: true });
    try {
      await API.delete(`/biblioteca/${biblio.idLocal}`);
      setBiblio(INIT_BIBLIO);
      setUiCampos({ editando: false });
      avisar('Quitado de tu biblioteca.');
    } catch (err) {
      avisar(err.response?.data?.message || 'No pudimos quitarlo de tu biblioteca.', true);
    } finally {
      setUiCampos({ ocupado: false });
    }
  };

  const alternarGuardado = () =>
    biblio.guardado ? quitarDeBiblioteca() : guardar({}, 'Guardado en tu biblioteca.');

  const alternarFavorito = () =>
    guardar(
      { es_favorito: !biblio.interact.es_favorito },
      biblio.interact.es_favorito ? 'Quitado de favoritos.' : 'Agregado a favoritos.'
    );

  const abrirEdicion = () => {
    if (!checkAuth()) return;
    setUiCampos({ editando: true, borrador: biblio.interact.resena || '' });
  };

  const guardarResena = async () => {
    const texto = ui.borrador.trim();
    if (!texto) return;
    const ok = await guardar({ resena: texto }, 'Reseña guardada.');
    if (ok) setUiCampos({ editando: false }); // si falla, el borrador se conserva
  };

  const eliminarResena = async () => {
    if (!biblio.idLocal) {
      avisar('No pudimos identificar este ítem en tu biblioteca.', true);
      return;
    }
    setUiCampos({ ocupado: true });
    try {
      await API.delete(`/biblioteca/${biblio.idLocal}/resena`);
      setBiblio((b) => ({ ...b, interact: { ...b.interact, resena: '' } }));
      setUiCampos({ editando: false });
      avisar('Reseña eliminada.');
    } catch (err) {
      avisar(err.response?.data?.message || 'No pudimos eliminar la reseña.', true);
    } finally {
      setUiCampos({ ocupado: false });
    }
  };

  const alternarMenuPlaylists = async () => {
    if (!checkAuth()) return;
    const abrir = !ui.menuAbierto;
    setUiCampos({ menuAbierto: abrir });
    if (abrir && playlists === null) {
      try {
        const res = await API.get('/playlist');
        setPlaylists(normalizar(res.data));
      } catch {
        setUiCampos({ menuAbierto: false });
        avisar('No pudimos cargar tus playlists.', true);
      }
    }
  };

  const agregarAPlaylist = async (playlistId, nombre) => {
    setUiCampos({ menuAbierto: false });
    try {
      await API.post(`/playlist/${playlistId}/items`, { id_externo: idExterno, tipo });
      avisar(`Agregado a “${nombre}”.`);
    } catch (err) {
      avisar(err.response?.data?.message || 'No pudimos agregarlo a la playlist.', true);
    }
  };

  // --- Derivados ---
  const canciones = detalle?.canciones ?? [];
  const albumes = detalle?.albumes ?? [];
  const anio = getAnio(detalle?.fecha) ?? getAnio(albumInfo?.fecha);

  const tags = useMemo(() => {
    const crudos = Array.isArray(detalle?.tags) ? detalle.tags.map((t) => t?.name ?? t) : [detalle?.genero];
    return [...new Set(crudos.filter(Boolean))].slice(0, 6);
  }, [detalle]);

  const descripcion = useMemo(() => {
    if (!detalle) return '';
    if (detalle.descripcion || detalle.bio) return detalle.descripcion ?? detalle.bio;
    if (tipo === 'track') {
      return `Canción de ${detalle.nombre_artista}${albumInfo?.titulo ? `, incluida en “${albumInfo.titulo}”` : ''}.`;
    }
    if (tipo === 'album') {
      return `Álbum de ${detalle.nombre_artista}${canciones.length ? ` con ${canciones.length} canciones` : ''}.`;
    }
    return `Artista con ${albumes.length} ${albumes.length === 1 ? 'álbum' : 'álbumes'} en su discografía.`;
  }, [detalle, tipo, albumInfo, canciones.length, albumes.length]);

  const { interact } = biblio;

  // ---------- Render ----------
  return (
    <div className="detalle-container">
      <Header />

      <main className="detalle-main">
        <button type="button" className="detalle-volver" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>

        {error ? (
          <div className="detalle-estado" role="alert">
            <p>{error}</p>
            <div className="detalle-estado-botones">
              {TIPOS[tipo] && (
                <button type="button" className="detalle-btn" onClick={() => setReintentos((n) => n + 1)}>
                  Reintentar
                </button>
              )}
              <button type="button" className="detalle-btn is-outline" onClick={() => navigate('/explorar')}>
                Ir a Explorar
              </button>
            </div>
          </div>
        ) : cargando || !detalle ? (
          <>
            <section className="detalle-card" aria-hidden="true">
              <div className="detalle-visual">
                <div className={`detalle-skeleton is-visual ${tipo === 'album' ? 'is-square' : ''}`} />
              </div>
              <div className="detalle-info is-skeleton">
                <div className="detalle-skeleton is-line is-title" />
                <div className="detalle-skeleton is-line" />
                <div className="detalle-skeleton is-line" />
                <div className="detalle-skeleton is-line is-short" />
              </div>
            </section>
            {lento && <p className="detalle-aviso-lento">El servidor está despertando, puede tardar hasta un minuto...</p>}
          </>
        ) : (
          <>
            <section className="detalle-card">
              <div className="detalle-visual">
                <Visual tipo={tipo} detalle={detalleVisual} />
              </div>

              <div className="detalle-info">
                <div className="detalle-acciones-top">
                  <button
                    type="button"
                    className={`detalle-icono ${interact.es_favorito ? 'is-on' : ''}`}
                    onClick={alternarFavorito}
                    disabled={ui.ocupado}
                    aria-pressed={interact.es_favorito}
                    aria-label={interact.es_favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
                    title={interact.es_favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`detalle-icono ${biblio.guardado ? 'is-on' : ''}`}
                    onClick={alternarGuardado}
                    disabled={ui.ocupado}
                    aria-pressed={biblio.guardado}
                    aria-label={biblio.guardado ? 'Quitar de la biblioteca' : 'Guardar en la biblioteca'}
                    title={biblio.guardado ? 'Quitar de la biblioteca' : 'Guardar en la biblioteca'}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 3h12v18l-6-4.5L6 21z" />
                    </svg>
                  </button>
                </div>

                <span className="detalle-tipo">{TIPOS[tipo]}</span>
                <h1 className="detalle-titulo">{detalle.titulo}</h1>

                {tipo !== 'artist' && (
                  <p className="detalle-artista">
                    {detalle.id_artista_externo ? (
                      <button
                        type="button"
                        className="detalle-link"
                        onClick={() => navigate(`/detalle/artist/${detalle.id_artista_externo}`)}
                      >
                        {detalle.nombre_artista}
                      </button>
                    ) : (
                      detalle.nombre_artista
                    )}
                  </p>
                )}

                <dl className="detalle-datos">
                  {tipo !== 'artist' && <Dato etiqueta="Año de publicación">{anio ?? '—'}</Dato>}

                  <Dato etiqueta="Tags">
                    {tags.length ? (
                      <ul className="detalle-tags">
                        {tags.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </Dato>

                  {tipo === 'track' && <Dato etiqueta="Duración">{formatoDuracion(detalle.duracion_seg) ?? '—'}</Dato>}
                  {tipo === 'album' && <Dato etiqueta="Canciones">{canciones.length || '—'}</Dato>}
                  {tipo === 'artist' && <Dato etiqueta="Álbumes">{albumes.length || '—'}</Dato>}

                  {tipo === 'track' && (
                    <Dato etiqueta="Álbum">
                      {console.log(detalle)}
                      {detalle.id_album_externo ? (
                        <button
                          type="button"
                          className="detalle-link"
                          onClick={() => navigate(`/detalle/album/${detalle.id_album_externo}`)}
                        >
                          {detalle.nombre_album ?? 'Ver álbum'}
                        </button>
                      ) : (
                        '—'
                      )}
                    </Dato>
                  )}

                  <Dato etiqueta="Descripción">{descripcion}</Dato>
                </dl>

                <div className="detalle-estados" role="group" aria-label="Estado de escucha">
                  {ESTADOS.map((e) => (
                    <button
                      key={e.valor}
                      type="button"
                      className={`detalle-chip ${interact.estado === e.valor && biblio.guardado ? 'is-active' : ''}`}
                      onClick={() => guardar({ estado: e.valor }, 'Estado actualizado.')}
                      disabled={ui.ocupado}
                    >
                      {e.etiqueta}
                    </button>
                  ))}
                </div>

                <div className="detalle-resenar">
                  <span className="detalle-resenar-label">Reseñar</span>
                  <Estrellas
                    valor={interact.puntuacion}
                    onElegir={(n) => guardar({ puntuacion: n }, 'Puntuación guardada.')}
                    deshabilitado={ui.ocupado}
                  />
                </div>

                {ui.editando ? (
                  <div className="detalle-resena-form">
                    <textarea
                      value={ui.borrador}
                      onChange={(e) => setUiCampos({ borrador: e.target.value.slice(0, MAX_RESENA) })}
                      placeholder="¿Qué te pareció?"
                      rows={4}
                      aria-label="Tu reseña"
                      autoFocus
                    />
                    <div className="detalle-resena-pie">
                      <span>
                        {ui.borrador.length}/{MAX_RESENA}
                      </span>
                      <div>
                        <button
                          type="button"
                          className="detalle-btn is-light is-small"
                          onClick={() => setUiCampos({ editando: false })}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="detalle-btn is-small"
                          onClick={guardarResena}
                          disabled={ui.ocupado || !ui.borrador.trim()}
                        >
                          Guardar reseña
                        </button>
                      </div>
                    </div>
                  </div>
                ) : interact.resena ? (
                  <figure className="detalle-resena">
                    <blockquote>{interact.resena}</blockquote>
                    <figcaption>
                      <button type="button" className="detalle-link" onClick={abrirEdicion}>
                        Editar
                      </button>
                      <button type="button" className="detalle-link" onClick={eliminarResena} disabled={ui.ocupado}>
                        Eliminar
                      </button>
                    </figcaption>
                  </figure>
                ) : (
                  <button type="button" className="detalle-link is-block" onClick={abrirEdicion}>
                    Escribir una reseña
                  </button>
                )}

                {tipo !== 'artist' && (
                  <div className="detalle-playlist" ref={menuRef}>
                    <button
                      type="button"
                      className="detalle-btn is-light"
                      onClick={alternarMenuPlaylists}
                      aria-haspopup="menu"
                      aria-expanded={ui.menuAbierto}
                    >
                      + Agregar a playlist
                    </button>

                    {ui.menuAbierto && (
                      <div className="detalle-menu" role="menu">
                        {playlists === null && (
                          <p className="detalle-menu-vacio">Cargando...</p>
                        )}
                        {playlists !== null && playlists.length === 0 && (
                          <>
                            <p className="detalle-menu-vacio">Todavía no tenés playlists.</p>
                            <button type="button" role="menuitem" onClick={() => navigate('/playlist')}>
                              Crear una playlist
                            </button>
                          </>
                        )}
                        {playlists !== null && playlists.length > 0 && playlists.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            role="menuitem"
                            onClick={() => agregarAPlaylist(p.id, p.nombre)}
                          >
                            {p.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {tipo === 'album' && <SeccionCanciones canciones={canciones} navigate={navigate} />}
            {tipo === 'artist' && <SeccionDiscografia albumes={albumes} navigate={navigate} />}
          </>
        )}
      </main>

      {ui.aviso && (
        <div className={`detalle-toast ${ui.aviso.esError ? 'is-error' : ''}`} role="status" aria-live="polite">
          {ui.aviso.texto}
        </div>
      )}
    </div>
  );
};

export default Detalle;