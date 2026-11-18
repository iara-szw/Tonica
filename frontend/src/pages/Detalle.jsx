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
const INIT_BIBLIO = { guardado: false, idLocal: null, interact: { estado: null, es_favorito: false, puntuacion: null, resena: '' } };

// ---------- Helpers ----------
const normalizar = (data) => Array.isArray(data) ? data : (data?.resultados ?? data?.results ?? data?.items ?? data?.playlists ?? []);
const getAnio = (fecha) => /^\d{4}/.exec(fecha)?.[0] ?? null;
const formatoDuracion = (seg) => seg ? `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}` : null;
const limpiarObjeto = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== ''));

// ---------- Subcomponentes UI ----------
const Imagen = ({ src, alt, className }) => {
  const [falla, setFalla] = useState(false);
  return src && !falla ? <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFalla(true)} /> : <div className={`${className} is-vacio`} aria-hidden="true" />;
};
const Dato = ({ e, children }) => <><dt>{e}</dt><dd>{children}</dd></>;
const Estrellas = ({ valor, onElegir, deshabilitado }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="detalle-estrellas" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={deshabilitado} className={`detalle-estrella ${n <= (hover || valor || 0) ? 'is-on' : ''}`}
          onMouseEnter={() => setHover(n)} onClick={() => onElegir(n)}>
          <svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
        </button>
      ))}
    </div>
  );
};

// ---------- Componente Principal ----------
const Detalle = () => {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const logueado = !!localStorage.getItem('token');

  const [data, setData] = useState({ detalle: null, albumInfo: null, cargando: true, error: null });
  const [biblio, setBiblio] = useState(INIT_BIBLIO);
  const [ui, setUi] = useState({ ocupado: false, editando: false, borrador: '', menuAbierto: false, aviso: null });
  const [playlists, setPlaylists] = useState(null);
  const menuRef = useRef(null);
  
  const idExterno = data.detalle?.id_externo ?? id;
  const avisar = (texto, esError = false) => setUi(prev => ({ ...prev, aviso: { texto, esError } }));

  // --- Carga Inicial ---
  useEffect(() => {
    if (!TIPOS[tipo]) return setData({ detalle: null, cargando: false, error: 'Tipo inválido' });
    
    window.scrollTo(0, 0);
    setData({ detalle: null, albumInfo: null, cargando: true, error: null });
    
    const fetchDetalle = async () => {
      try {
        const res = await API.get(`/musica/detalle/${tipo}/${id}`);
        const detalle = res.data?.detalle ?? res.data?.resultado ?? res.data;
        setData(prev => ({ ...prev, detalle, cargando: false }));
        
        // Si es track, buscar su álbum
        if (tipo === 'track' && detalle.id_album_externo) {
          const resAlbum = await API.get(`/musica/detalle/album/${detalle.id_album_externo}`);
          setData(prev => ({ ...prev, albumInfo: resAlbum.data?.detalle ?? resAlbum.data }));
        }
      } catch (err) {
        setData({ detalle: null, cargando: false, error: err.response?.status === 404 ? 'No encontrado.' : 'Error al cargar.' });
      }
    };
    fetchDetalle();
  }, [tipo, id]);

  // --- Carga Biblioteca ---
  const cargarBiblioteca = useCallback(async (idBuscado) => {
    if (!logueado || !idBuscado) return;
    try {
      const res = await API.get('/biblioteca');
      const item = normalizar(res.data).find(i => i.id_externo === idBuscado);
      if (item) setBiblio({ guardado: true, idLocal: item.id_cancion ?? item.id, interact: { estado: item.estado, es_favorito: !!item.es_favorito, puntuacion: item.puntuacion, resena: item.resena ?? '' } });
      else setBiblio(INIT_BIBLIO);
    } catch (err) { console.error(err); }
  }, [logueado]);

  useEffect(() => { idExterno && cargarBiblioteca(idExterno); }, [idExterno, cargarBiblioteca]);

  // --- Limpiar avisos y menús ---
  useEffect(() => { if (ui.aviso) { const t = setTimeout(() => setUi(p => ({...p, aviso: null})), 3000); return () => clearTimeout(t); } }, [ui.aviso]);
  useEffect(() => { 
    const cerrar = (e) => menuRef.current && !menuRef.current.contains(e.target) && setUi(p => ({ ...p, menuAbierto: false }));
    document.addEventListener('mousedown', cerrar); return () => document.removeEventListener('mousedown', cerrar); 
  }, []);

  // --- Acciones de Biblioteca ---
  const checkAuth = () => { if (!logueado) { navigate('/login'); return false; } return true; };

  const actualizarInteraccion = async (cambios) => {
    if (!checkAuth()) return;
    setUi(prev => ({ ...prev, ocupado: true }));
    try {
      const nuevaInteract = { ...biblio.interact, estado: biblio.interact.estado ?? 'quiero_escuchar', ...cambios };
      await API.post('/biblioteca', { id_externo: idExterno, tipo, interact: limpiarObjeto(nuevaInteract) });
      await cargarBiblioteca(idExterno);
      avisar('Guardado exitosamente');
    } catch (err) { avisar('Error al guardar', true); }
    finally { setUi(prev => ({ ...prev, ocupado: false, editando: false })); }
  };

  const quitarDeBiblioteca = async () => {
    if (!biblio.idLocal) return;
    setUi(prev => ({ ...prev, ocupado: true }));
    try {
      await API.delete(`/biblioteca/${biblio.idLocal}`);
      setBiblio(INIT_BIBLIO);
      avisar('Quitado de tu biblioteca.');
    } catch (err) { avisar('Error al quitar', true); }
    finally { setUi(prev => ({ ...prev, ocupado: false })); }
  };

  const toggleMenuPlaylists = async () => {
    if (!checkAuth()) return;
    const abrir = !ui.menuAbierto;
    setUi(prev => ({ ...prev, menuAbierto: abrir }));
    if (abrir && !playlists) {
      try { const res = await API.get('/playlists'); setPlaylists(normalizar(res.data)); }
      catch (err) { avisar('Error cargando playlists', true); }
    }
  };

  const agregarAPlaylist = async (playlistId, nombre) => {
    setUi(prev => ({ ...prev, menuAbierto: false }));
    try { await API.post(`/playlists/${playlistId}/items`, { id_externo: idExterno, tipo }); avisar(`Agregado a "${nombre}"`); }
    catch (err) { avisar('Error al agregar a playlist', true); }
  };

  // --- Derivados UI ---
  const { detalle, albumInfo, cargando, error } = data;
  const anio = getAnio(detalle?.fecha) ?? getAnio(albumInfo?.fecha);
  const tags = useMemo(() => [...new Set((Array.isArray(detalle?.tags) ? detalle.tags.map(t => t?.name ?? t) : [detalle?.genero]).filter(Boolean))].slice(0,6), [detalle]);

  if (error) return <div className="detalle-estado"><p>{error}</p><button className="detalle-btn is-outline" onClick={() => navigate(-1)}>Volver</button></div>;
  if (cargando || !detalle) return <div className="detalle-estado">Cargando...</div>; // Reemplazable por tu skeleton

  return (
    <div className="detalle-container">
      <Header />
      <main className="detalle-main">
        <button className="detalle-volver" onClick={() => navigate(-1)}>Volver</button>
        
        <section className="detalle-card">
          <div className="detalle-visual">
             <Imagen src={detalle.portada_url} alt={detalle.titulo} className="detalle-img" />
          </div>

          <div className="detalle-info">
            <div className="detalle-acciones-top">
              <button className={`detalle-icono ${biblio.interact.es_favorito ? 'is-on' : ''}`} onClick={() => actualizarInteraccion({ es_favorito: !biblio.interact.es_favorito })} disabled={ui.ocupado}>★</button>
              <button className={`detalle-icono ${biblio.guardado ? 'is-on' : ''}`} onClick={() => biblio.guardado ? quitarDeBiblioteca() : actualizarInteraccion({})} disabled={ui.ocupado}>✚</button>
            </div>

            <span className="detalle-tipo">{TIPOS[tipo]}</span>
            <h1 className="detalle-titulo">{detalle.titulo}</h1>
            {tipo !== 'artist' && <p className="detalle-artista">{detalle.nombre_artista}</p>}

            <dl className="detalle-datos">
              {tipo !== 'artist' && <Dato e="Año">{anio ?? '—'}</Dato>}
              {tipo === 'track' && <Dato e="Duración">{formatoDuracion(detalle.duracion_seg) ?? '—'}</Dato>}
              <Dato e="Tags">{tags.length ? tags.join(', ') : '—'}</Dato>
            </dl>

            <div className="detalle-estados">
              {ESTADOS.map(e => (
                <button key={e.valor} className={`detalle-chip ${biblio.interact.estado === e.valor && biblio.guardado ? 'is-active' : ''}`} 
                        onClick={() => actualizarInteraccion({ estado: e.valor })} disabled={ui.ocupado}>{e.etiqueta}</button>
              ))}
            </div>

            <div className="detalle-resenar">
              <span>Reseñar</span>
              <Estrellas valor={biblio.interact.puntuacion} onElegir={(n) => actualizarInteraccion({ puntuacion: n })} deshabilitado={ui.ocupado} />
            </div>

            {ui.editando ? (
               <div className="detalle-resena-form">
                 <textarea value={ui.borrador} onChange={e => setUi(p => ({...p, borrador: e.target.value.slice(0, 500)}))} autoFocus />
                 <button onClick={() => actualizarInteraccion({ resena: ui.borrador })} disabled={!ui.borrador.trim()}>Guardar</button>
                 <button onClick={() => setUi(p => ({...p, editando: false}))}>Cancelar</button>
               </div>
            ) : biblio.interact.resena ? (
               <figure className="detalle-resena">
                 <blockquote>{biblio.interact.resena}</blockquote>
                 <button className="detalle-link" onClick={() => setUi(p => ({...p, editando: true, borrador: biblio.interact.resena}))}>Editar</button>
               </figure>
            ) : (
               <button className="detalle-link" onClick={() => setUi(p => ({...p, editando: true, borrador: ''}))}>Escribir reseña</button>
            )}

            {tipo !== 'artist' && (
              <div className="detalle-playlist" ref={menuRef}>
                <button className="detalle-btn is-light" onClick={toggleMenuPlaylists}>+ Playlist</button>
                {ui.menuAbierto && (
                  <div className="detalle-menu">
                    {playlists?.map(p => <button key={p.id} onClick={() => agregarAPlaylist(p.id, p.nombre)}>{p.nombre}</button>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {tipo === 'album' && <SeccionCanciones canciones={detalle.canciones} navigate={navigate} />}
        {tipo === 'artist' && <SeccionDiscografia albumes={detalle.albumes} navigate={navigate} />}
      </main>
      
      {ui.aviso && <div className={`detalle-toast ${ui.aviso.esError ? 'is-error' : ''}`}>{ui.aviso.texto}</div>}
    </div>
  );
};

// ---------- Subcomponentes de Listas extraídos ----------
const SeccionCanciones = ({ canciones = [], navigate }) => (
  <section className="detalle-seccion">
    <h2 className="detalle-seccion-titulo">Canciones</h2>
    {canciones.length ? (
      <ol className="detalle-tracks">
        {canciones.map((c, i) => {
          const tid = c.id_externo || c.id || c.id_cancion;
          return (
            <li key={`${tid}-${i}`}>
              <button onClick={() => tid && navigate(`/detalle/track/${tid}`)}>
                <span className="detalle-track-n">{c.posicion ?? i + 1}</span>
                <span className="detalle-track-t">{c.titulo ?? c.name}</span>
                <span className="detalle-track-d">{formatoDuracion(c.duracion_seg)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    ) : <p>No hay canciones.</p>}
  </section>
);

const SeccionDiscografia = ({ albumes = [], navigate }) => (
  <section className="detalle-seccion">
    <h2 className="detalle-seccion-titulo">Discografía</h2>
    {albumes.length ? (
      <div className="detalle-grid">
        {albumes.map((a, i) => {
          const aid = a.id_album_externo || a.id_externo || a.id;
          return (
            <button key={`${aid}-${i}`} className="detalle-mini" onClick={() => aid && navigate(`/detalle/album/${aid}`)}>
              <Imagen src={a.portada_url} className="detalle-img" />
              <h3>{a.titulo}</h3>
              <p>{getAnio(a.fecha)}</p>
            </button>
          );
        })}
      </div>
    ) : <p>No hay álbumes.</p>}
  </section>
);

export default Detalle;