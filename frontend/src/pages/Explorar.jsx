import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import Portada from '../componentes/Portada';
import '../style/explorar.css';

const TIPOS = [
  { valor: 'track', etiqueta: 'Canciones', titulo: 'Canciones para explorar' },
  { valor: 'album', etiqueta: 'Albumes', titulo: 'Albumes para explorar' },
];

const ORDENES = [
  { valor: 'relevancia', etiqueta: 'Relevancia' },
  { valor: 'titulo', etiqueta: 'Título (A-Z)' },
  { valor: 'artista', etiqueta: 'Artista (A-Z)' },
  { valor: 'anio-desc', etiqueta: 'Más recientes' },
  { valor: 'anio-asc', etiqueta: 'Más antiguos' },
];

const SUGERENCIAS = ['rock', 'pop', 'indie', 'jazz', 'cumbia', 'electronica', 'soul', 'folk'];
const GENEROS_MAESTROS = [
  'Rock', 'Pop', 'Indie', 'Jazz', 'Blues', 'Cumbia', 'Electrónica',
  'Soul', 'Folk', 'Clásica', 'Hip-hop', 'Rap', 'Reggaetón', 'R&B',
  'Metal', 'Punk', 'Country', 'Reggae', 'Salsa', 'Tango', 'Funk',
  'Disco', 'House', 'Techno', 'Trap', 'Ambient', 'Gospel', 'Bossa Nova',
  'Ska', 'Heavy Metal', 'Alternativo'
];
const POR_PAGINA = 18;
const SKELETONS = 12;

const terminoRandom = () => SUGERENCIAS[Math.floor(Math.random() * SUGERENCIAS.length)];

const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  return data?.resultados ?? data?.results ?? [];
};

const leerGenerosFavoritos = (raw) => {
  let valor = raw;

  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (texto.startsWith('{') || texto.startsWith('[')) {
      try {
        valor = JSON.parse(texto);
      } catch {
        valor = texto;
      }
    }
  }

  if (Array.isArray(valor)) return [...new Set(valor.map((g) => String(g).trim()).filter(Boolean))];
  if (valor && typeof valor === 'object') {
    const lista = valor.generos ?? valor.generos_favoritos ?? [];
    return [...new Set((Array.isArray(lista) ? lista : []).map((g) => String(g).trim()).filter(Boolean))];
  }
  if (typeof valor === 'string' && valor.trim()) {
    return [...new Set(valor.split(',').map((g) => g.trim()).filter(Boolean))];
  }
  return [];
};

const getAnio = (item) => {
  const bruto = item.anio ?? item.year ?? item.fecha ?? item.fecha_lanzamiento ?? null;
  if (!bruto) return null;
  const anio = String(bruto).slice(0, 4);
  return /^\d{4}$/.test(anio) ? anio : null;
};

const comparar = (a, b) => (a || '').localeCompare(b || '', 'es', { sensitivity: 'base' });

const ordenar = (lista, orden) => {
  if (orden === 'relevancia') return lista;
  const copia = [...lista];
  switch (orden) {
    case 'titulo':
      return copia.sort((a, b) => comparar(a.titulo, b.titulo));
    case 'artista':
      return copia.sort((a, b) => comparar(a.nombre_artista, b.nombre_artista));
    case 'anio-desc':
    case 'anio-asc': {
      const dir = orden === 'anio-desc' ? -1 : 1;
      return copia.sort((a, b) => {
        const ya = Number(getAnio(a));
        const yb = Number(getAnio(b));
        if (!ya && !yb) return 0;
        if (!ya) return 1;
        if (!yb) return -1;
        return (ya - yb) * dir;
      });
    }
    default:
      return lista;
  }
};

const Explorar = () => {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState('track');
  const [busqueda, setBusqueda] = useState('');
  const [termino, setTermino] = useState('');
  const [genero, setGenero] = useState('');
  const [orden, setOrden] = useState('relevancia');

  const [resultados, setResultados] = useState([]);
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [cargando, setCargando] = useState(true);
  const [lento, setLento] = useState(false);
  const [error, setError] = useState(null);
  const [reintentos, setReintentos] = useState(0);
  const [generosFavoritos, setGenerosFavoritos] = useState([]);
  const [generosCatalogo, setGenerosCatalogo] = useState([]);
  const [preferenciasCargadas, setPreferenciasCargadas] = useState(false);

  const [terminoDefault] = useState(terminoRandom);

  // Debounce ajustado a 550ms para evitar ráfagas al escribir
  useEffect(() => {
    const id = setTimeout(() => setTermino(busqueda.trim()), 550);
    return () => clearTimeout(id);
  }, [busqueda]);

  // Carga de resultados blindada
  useEffect(() => {
    if (!preferenciasCargadas) return undefined;

    const controller = new AbortController();
    const avisoLento = setTimeout(() => setLento(true), 5000);

    setCargando(true);
    setLento(false);
    setError(null);
    setResultados([]);
    setVisibles(POR_PAGINA);

    const cargar = async () => {
      try {
        if (termino) {
          const res = await API.get('/musica/search', {
            params: { q: termino, type: tipo },
            signal: controller.signal,
          });
          setResultados(normalizarLista(res.data));
          return;
        }

        if (genero) {
          const res = await API.get('/musica/search', {
            params: { q: genero, type: tipo },
            signal: controller.signal,
          });
          setResultados(normalizarLista(res.data));
          return;
        }

        const consultas = generosFavoritos.length > 0
          ? generosFavoritos
          : [terminoDefault];

        const respuestas = await Promise.allSettled(
          consultas.map((generoFavorito) => API.get('/musica/search', {
            params: { q: generoFavorito, type: tipo },
            signal: controller.signal,
          }))
        );

        const combinados = [];
        const ids = new Set();
        respuestas.forEach((respuesta) => {
          if (respuesta.status !== 'fulfilled') return;
          normalizarLista(respuesta.value.data).forEach((item) => {
            const clave = item.id_externo || `${item.titulo}-${item.nombre_artista}`;
            if (!ids.has(clave)) {
              ids.add(clave);
              combinados.push(item);
            }
          });
        });

        if (combinados.length > 0) {
          setResultados(combinados);
        } else {
          const fallos = respuestas.filter((respuesta) => respuesta.status === 'rejected');
          const ultimoError = fallos[0]?.reason;
          setError(
            ultimoError?.response?.status === 503 || ultimoError?.response?.status === 429
              ? 'El servicio de música está temporalmente saturado. Espera unos segundos y reintenta.'
              : 'No pudimos cargar los resultados. Probá de nuevo.'
          );
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Error al buscar música:', err);
        setError(
          err.response?.status === 503 || err.response?.status === 429
            ? 'El servicio de música está temporalmente saturado. Espera unos segundos y reintenta.'
            : 'No pudimos cargar los resultados. Probá de nuevo.'
        );
      } finally {
        clearTimeout(avisoLento);
        if (!controller.signal.aborted) {
          setCargando(false);
          setLento(false);
        }
      }
    };

    cargar();

    return () => {
      controller.abort();
      clearTimeout(avisoLento);
    };
  }, [tipo, termino, genero, terminoDefault, reintentos, preferenciasCargadas, generosFavoritos]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setPreferenciasCargadas(true);
      return undefined;
    }

    const controller = new AbortController();

    API.get('/auth/perfil', { signal: controller.signal })
      .then((res) => {
        const perfil = res.data?.perfil ?? res.data?.usuario ?? res.data?.user ?? res.data;
        setGenerosFavoritos(leerGenerosFavoritos(perfil?.preferencias));
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setGenerosFavoritos([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreferenciasCargadas(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    API.get('/musica/generos', { signal: controller.signal })
      .then((res) => {
        setGenerosCatalogo(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setGenerosCatalogo([]);
      });

    return () => controller.abort();
  }, []);

  const generos = useMemo(() => {
    const set = new Set([
      ...GENEROS_MAESTROS,
      ...generosCatalogo,
      ...resultados.map((r) => r.genero).filter(Boolean)
    ].map((valor) => String(valor).trim()).filter(Boolean));

    return [...set].sort((a, b) => comparar(a, b));
  }, [generosCatalogo, resultados]);

  const filtrados = useMemo(() => {
    return ordenar(resultados, orden);
  }, [resultados, orden]);

  const lista = filtrados.slice(0, visibles);
  const tipoActual = TIPOS.find((t) => t.valor === tipo);
const tituloSeccion = tipoActual ? tipoActual.titulo : 'Explorar';
  const irAlDetalle = (item) => navigate(`/detalle/${tipo}/${item.id_externo}`, {
    state: { itemPortada: item }
  });

  const subtitulo = (item) => {
    const artista = item.nombre_artista || (tipo === 'album' ? 'Varios artistas' : 'Artista desconocido');
    return [artista, getAnio(item)].filter(Boolean).join(' - ');
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setTermino('');
  };

  return (
    <div className="explorar-container">
      <Header />
      <main className="explorar-main">
        <div className="explorar-header">
          <h2 className="explorar-title">Explorar</h2>
          <div className="explorar-tabs" role="tablist">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                role="tab"
                aria-selected={tipo === t.valor}
                className={`explorar-tab ${tipo === t.valor ? 'is-active' : ''}`}
                onClick={() => setTipo(t.valor)}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="explorar-toolbar">
          <label className="explorar-search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={tipo === 'track' ? 'Buscar canciones o artistas...' : 'Buscar albumes o artistas...'}
            />
          </label>

          {generos.length > 0 && (
            <select
              className="explorar-select"
              value={genero}
              onChange={(e) => {
                setGenero(e.target.value);
                setVisibles(POR_PAGINA);
              }}
            >
              <option value="">Todos los géneros</option>
              {generos.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          <select
            className="explorar-select"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
            ))}
          </select>
        </div>

        <section className="explorar-section">
          <div className="explorar-section-head">
            <h3 className="explorar-section-title">{tituloSeccion}</h3>
            {!cargando && !error && (
              <span className="explorar-count">
                {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>

          <div className="explorar-panel">
            {error ? (
              <div className="explorar-estado" role="alert">
                <p>{error}</p>
                <button type="button" className="explorar-btn" onClick={() => setReintentos((n) => n + 1)}>
                  Reintentar
                </button>
              </div>
            ) : cargando ? (
              <>
                <div className="explorar-grid" aria-hidden="true">
                  {Array.from({ length: SKELETONS }).map((_, i) => (
                    <div key={i} className="explorar-card">
                      <div className={`explorar-skeleton ${tipo === 'track' ? 'is-disc' : 'is-album'}`} />
                      <div className="explorar-skeleton explorar-skeleton-line" />
                      <div className="explorar-skeleton explorar-skeleton-line is-short" />
                    </div>
                  ))}
                </div>
                {lento && <p className="explorar-aviso">Cargando catálogo, puede tardar un poco...</p>}
              </>
            ) : filtrados.length === 0 ? (
              <div className="explorar-estado">
                <p>No encontramos resultados{termino ? ` para "${termino}"` : ''}.</p>
                {(busqueda || genero) && (
                  <button
                    type="button"
                    className="explorar-btn"
                    onClick={() => {
                      limpiarBusqueda();
                      setGenero('');
                    }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="explorar-grid">
                  {lista.map((item, i) => (
                    <button
                      key={`${tipo}-${item.id_externo ?? i}`}
                      type="button"
                      className="explorar-card"
                      onClick={() => irAlDetalle(item)}
                    >
                      
                      {tipo === 'track' ? (
                        <div className="explorar-disc">
                          {item.portada_url && <img src={item.portada_url} alt="Portada" loading="lazy" />}
                        </div>
                      ) : (
                        <div className="explorar-cover">
                          <Portada alt="Portada" tipo="album" url={item.portada_url} />
                        </div>
                      )}
                      <h4 className="explorar-item-title" title={item.titulo}>{item.titulo}</h4>
                      <p className="explorar-item-subtitle" title={subtitulo(item)}>{subtitulo(item)}</p>
                    </button>
                  ))}
                </div>
                {visibles < filtrados.length && (
                  <div className="explorar-more">
                    <button type="button" className="explorar-btn is-outline" onClick={() => setVisibles((v) => v + POR_PAGINA)}>
                      Ver más
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Explorar;