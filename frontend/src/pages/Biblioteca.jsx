import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/biblioteca.css';

/* ---------- Constantes ---------- */
const TIPOS = { track: 'track', cancion: 'track', album: 'album', artist: 'artist', artista: 'artist' };
const TIPO_LABEL = { track: 'Canción', album: 'Álbum', artist: 'Artista' };
const ESTADO_LABEL = {
    quiero_escuchar: 'Quiero escuchar',
    escuchando: 'Escuchando',
    escuchado: 'Escuchado',
};

const FILTROS_ESTADO = [
    { id: 'todos', label: 'Todos' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'escuchando', label: 'Escuchando' },
    { id: 'quiero_escuchar', label: 'Quiero escuchar' },
    { id: 'escuchado', label: 'Escuchados' },
];

const FILTROS_TIPO = [
    { id: 'todo', label: 'Todo' },
    { id: 'track', label: 'Canciones' },
    { id: 'album', label: 'Álbumes' },
    { id: 'artist', label: 'Artistas' },
];

/* ---------- Helpers ---------- */
// Acepta un array directo o { items | biblioteca | resultados: [...] }
const normalizarLista = (data) => {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.biblioteca ?? data?.resultados ?? data?.data ?? [];
};

const normalizarItem = (r) => ({
    id: r.id_cancion ?? r.id,
    idExterno: r.id_externo,
    tipo: TIPOS[String(r.tipo ?? 'track').toLowerCase()] ?? 'track',
    titulo: r.titulo ?? 'Sin título',
    artista: r.nombre_artista ?? r.artista ?? '',
    portada: r.portada_url ?? r.portada ?? null,
    estado: r.estado ?? null,
    favorito: Boolean(r.es_favorito),
    puntuacion: r.puntuacion ? Number(r.puntuacion) : 0,
    resena: typeof r.resena === 'string' ? r.resena.trim() : '',
});

// Para buscar sin importar mayúsculas ni tildes
const limpiarTexto = (s) =>
    String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Quita campos vacíos del body que va al backend
const sinVacios = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''));

const mensajeError = (err, porDefecto) =>
    err.response?.data?.message || err.response?.data?.error || porDefecto;

const recortar = (texto, max = 70) => (texto.length > max ? `${texto.slice(0, max).trim()}…` : texto);

/* ---------- Piezas chicas ---------- */
const IconoCorazon = ({ lleno }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={lleno ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
    </svg>
);

const IconoLupa = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const SkeletonBiblioteca = () => (
    <ul className="bib-grid" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="bib-card">
                <div className="bib-skel bib-skel-cover" />
                <div className="bib-skel bib-skel-line" />
                <div className="bib-skel bib-skel-line bib-skel-line-short" />
            </li>
        ))}
    </ul>
);

/* ---------- Vista ---------- */
const Biblioteca = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);

    const [estadoSel, setEstadoSel] = useState('todos');
    const [tipoSel, setTipoSel] = useState('todo');
    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState('recientes');

    const cargarBiblioteca = useCallback(async (signal) => {
        setCargando(true);
        setError(null);
        try {
            const res = await API.get('/biblioteca', { signal });
            setItems(normalizarLista(res.data).map(normalizarItem));
        } catch (err) {
            if (err.code === 'ERR_CANCELED') return;
            console.error('Error al cargar la biblioteca:', err);
            setError(
                mensajeError(
                    err,
                    'No pudimos cargar tu biblioteca. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.'
                )
            );
        } finally {
            if (!signal?.aborted) setCargando(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        cargarBiblioteca(controller.signal);
        return () => controller.abort();
    }, [cargarBiblioteca]);

    /* --- Acciones rápidas --- */
    const alternarFavorito = async (item) => {
        const nuevo = !item.favorito;
        setAviso(null);
        setItems((l) => l.map((x) => (x.id === item.id ? { ...x, favorito: nuevo } : x)));
        try {
            await API.post('/biblioteca', {
                id_externo: item.idExterno,
                tipo: item.tipo,
                interact: sinVacios({
                    estado: item.estado,
                    es_favorito: nuevo,
                    puntuacion: item.puntuacion || null,
                    resena: item.resena || null,
                }),
            });
        } catch (err) {
            setItems((l) => l.map((x) => (x.id === item.id ? { ...x, favorito: item.favorito } : x)));
            setAviso(mensajeError(err, 'No pudimos actualizar el favorito. Probá de nuevo.'));
        }
    };

    const quitar = async (item) => {
        if (!window.confirm(`¿Quitar "${item.titulo}" de tu biblioteca?`)) return;
        const anterior = items;
        setAviso(null);
        setItems((l) => l.filter((x) => x.id !== item.id));
        try {
            await API.delete(`/biblioteca/${item.id}`);
        } catch (err) {
            setItems(anterior);
            setAviso(mensajeError(err, 'No pudimos quitar el ítem. Probá de nuevo.'));
        }
    };

    const irAlDetalle = (item) => navigate(`/detalle/${item.tipo}/${item.idExterno}`);

    /* --- Filtrado --- */
    // Contadores de las pestañas de estado (respetan el filtro de tipo)
    const porTipo = useMemo(
        () => (tipoSel === 'todo' ? items : items.filter((i) => i.tipo === tipoSel)),
        [items, tipoSel]
    );

    const contadores = useMemo(
        () => ({
            todos: porTipo.length,
            favoritos: porTipo.filter((i) => i.favorito).length,
            escuchando: porTipo.filter((i) => i.estado === 'escuchando').length,
            quiero_escuchar: porTipo.filter((i) => i.estado === 'quiero_escuchar').length,
            escuchado: porTipo.filter((i) => i.estado === 'escuchado').length,
        }),
        [porTipo]
    );

    const visibles = useMemo(() => {
        const q = limpiarTexto(busqueda.trim());
        let lista = porTipo.filter((i) => {
            if (estadoSel === 'favoritos' && !i.favorito) return false;
            if (estadoSel !== 'todos' && estadoSel !== 'favoritos' && i.estado !== estadoSel) return false;
            if (q && !limpiarTexto(`${i.titulo} ${i.artista}`).includes(q)) return false;
            return true;
        });
        if (orden === 'titulo') {
            lista = [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
        } else if (orden === 'puntuacion') {
            lista = [...lista].sort((a, b) => b.puntuacion - a.puntuacion);
        }
        return lista;
    }, [porTipo, estadoSel, busqueda, orden]);

    const hayFiltros = estadoSel !== 'todos' || tipoSel !== 'todo' || busqueda.trim() !== '';
    const limpiarFiltros = () => {
        setEstadoSel('todos');
        setTipoSel('todo');
        setBusqueda('');
    };

    /* --- Render --- */
    const renderCard = (item) => (
        <li key={item.id ?? item.idExterno} className="bib-card">
            <div className="bib-cover-wrap">
                <button
                    type="button"
                    className="bib-open"
                    onClick={() => irAlDetalle(item)}
                    aria-label={`Abrir ${item.titulo}`}
                >
                    <span className={`bib-cover bib-cover-${item.tipo}`}>
                        {item.portada ? (
                            <img src={item.portada} alt="" loading="lazy" />
                        ) : (
                            item.tipo === 'artist' && (
                                <span className="bib-cover-inicial">{item.titulo.charAt(0).toUpperCase()}</span>
                            )
                        )}
                    </span>
                </button>
                <button
                    type="button"
                    className={`bib-fav ${item.favorito ? 'bib-fav-on' : ''}`}
                    onClick={() => alternarFavorito(item)}
                    aria-pressed={item.favorito}
                    aria-label={item.favorito ? `Quitar ${item.titulo} de favoritos` : `Marcar ${item.titulo} como favorito`}
                >
                    <IconoCorazon lleno={item.favorito} />
                </button>
            </div>

            <button type="button" className="bib-open bib-text" onClick={() => irAlDetalle(item)}>
                <span className="bib-title" title={item.titulo}>{item.titulo}</span>
                {item.artista && item.tipo !== 'artist' && <span className="bib-artist">{item.artista}</span>}
            </button>

            <div className="bib-meta">
                <span className="bib-badge">{TIPO_LABEL[item.tipo]}</span>
                {item.estado && ESTADO_LABEL[item.estado] && (
                    <span className="bib-badge bib-badge-estado">{ESTADO_LABEL[item.estado]}</span>
                )}
            </div>

            {item.puntuacion > 0 && (
                <span className="bib-stars" role="img" aria-label={`Puntuación ${item.puntuacion} de 5`}>
                    {'★'.repeat(item.puntuacion)}
                    <span className="bib-stars-off">{'★'.repeat(5 - item.puntuacion)}</span>
                </span>
            )}

            {item.resena && <p className="bib-resena" title={item.resena}>“{recortar(item.resena)}”</p>}

            <button type="button" className="bib-quitar" onClick={() => quitar(item)} aria-label={`Quitar ${item.titulo} de la biblioteca`}>
                Quitar
            </button>
        </li>
    );

    return (
        <div className="bib-container">
            <Header />

            <main className="bib-main">
                <h2 className="bib-page-title">Mi biblioteca</h2>

                {!error && (!cargando && items.length > 0) && (
                    <div className="bib-controles">
                        <div className="bib-pills" role="group" aria-label="Filtrar por estado">
                            {FILTROS_ESTADO.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    className="bib-pill"
                                    aria-pressed={estadoSel === f.id}
                                    onClick={() => setEstadoSel(f.id)}
                                >
                                    {f.label} <span className="bib-pill-count">{contadores[f.id]}</span>
                                </button>
                            ))}
                        </div>

                        <div className="bib-fila">
                            <label className="bib-search">
                                <IconoLupa />
                                <input
                                    type="search"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por título o artista..."
                                    aria-label="Buscar en tu biblioteca"
                                />
                            </label>

                            <div className="bib-pills bib-pills-tipo" role="group" aria-label="Filtrar por tipo">
                                {FILTROS_TIPO.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className="bib-pill"
                                        aria-pressed={tipoSel === f.id}
                                        onClick={() => setTipoSel(f.id)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <select
                                className="bib-select"
                                value={orden}
                                onChange={(e) => setOrden(e.target.value)}
                                aria-label="Ordenar"
                            >
                                <option value="recientes">Recientes</option>
                                <option value="titulo">Título (A-Z)</option>
                                <option value="puntuacion">Mejor puntuados</option>
                            </select>
                        </div>
                    </div>
                )}

                {aviso && <p className="bib-aviso" role="alert">{aviso}</p>}

                <section className="bib-panel" aria-live="polite">
                    {cargando ? (
                        <>
                            <SkeletonBiblioteca />
                            <p className="bib-loading">Cargando tu biblioteca... si el servidor estaba dormido puede tardar un poco.</p>
                        </>
                    ) : error ? (
                        <div className="bib-estado" role="alert">
                            <p className="bib-estado-error">{error}</p>
                            <button type="button" className="bib-btn" onClick={() => cargarBiblioteca()}>
                                Reintentar
                            </button>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="bib-estado">
                            <p className="bib-estado-titulo">Tu biblioteca está vacía</p>
                            <p>Guardá canciones, álbumes y artistas para armarla, puntuarlos y escribir reseñas.</p>
                            <Link to="/explorar" className="bib-btn">Explorar música</Link>
                        </div>
                    ) : visibles.length === 0 ? (
                        <div className="bib-estado">
                            <p className="bib-estado-titulo">Nada coincide con tus filtros</p>
                            <p>Probá con otra búsqueda o limpiá los filtros.</p>
                            {hayFiltros && (
                                <button type="button" className="bib-btn bib-btn-ghost" onClick={limpiarFiltros}>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="bib-seccion-head">
                                <h3 className="bib-seccion-titulo">Tu música guardada</h3>
                                <p className="bib-resultados">
                                    {visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'}
                                </p>
                            </div>
                            <ul className="bib-grid">{visibles.map(renderCard)}</ul>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Biblioteca;