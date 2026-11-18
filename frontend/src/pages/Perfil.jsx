import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import API from '../api/apiClient';
import Header from '../componentes/Header';
import '../style/perfil.css';

const MAX_BIO = 300;
const MAX_GENEROS = 8;
const LIMITE_INICIAL = 20;
const LIMITE_MAXIMO = 100;
const SUGERENCIAS = ['rock', 'pop', 'indie', 'jazz', 'cumbia', 'electrónica', 'hip hop', 'folk', 'soul', 'metal'];

// ---------- helpers ----------
const desenvolver = (data) => data?.perfil ?? data?.usuario ?? data?.user ?? data;

const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  return data?.actividad ?? data?.resultados ?? data?.items ?? [];
};

const mensajeError = (err) => {
  if (err.response) {
    const d = err.response.data;
    return d?.message || d?.error || (typeof d === 'string' && d) || 'No pudimos completar la operación.';
  }
  if (err.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Probá de nuevo.';
  return 'No pudimos conectar con el servidor. Revisá tu conexión.';
};

const urlValida = (texto) => {
  try {
    const u = new URL(texto);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const limpiarLista = (lista) =>
  [...new Set(lista.map((g) => String(g).trim()).filter(Boolean))].slice(0, MAX_GENEROS);

// El backend guarda "preferencias" en un formato que no conocemos con certeza.
// Todo el manejo de formato vive en estas dos funciones.
const leerPreferencias = (raw) => {
  let valor = raw;
  const eraTexto = typeof raw === 'string';

  if (eraTexto) {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        valor = JSON.parse(t);
      } catch {
        valor = raw;
      }
    }
  }

  if (Array.isArray(valor)) {
    return { forma: 'array', base: null, comoTexto: eraTexto, generos: limpiarLista(valor) };
  }
  if (valor && typeof valor === 'object') {
    const lista = valor.generos ?? valor.generos_favoritos ?? [];
    return {
      forma: 'objeto',
      base: valor,
      comoTexto: eraTexto,
      generos: limpiarLista(Array.isArray(lista) ? lista : []),
    };
  }
  if (typeof valor === 'string' && valor.trim()) {
    return { forma: 'texto', base: null, comoTexto: false, generos: limpiarLista(valor.split(',')) };
  }
  return { forma: 'array', base: null, comoTexto: false, generos: [] };
};

const serializarPreferencias = ({ forma, base, comoTexto }, generos) => {
  if (forma === 'texto') return generos.join(', ');
  const valor = forma === 'objeto' ? { ...base, generos } : generos;
  return comoTexto ? JSON.stringify(valor) : valor;
};

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const tiempoRelativo = (valor) => {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.getTime())) return '';
  const seg = Math.round((fecha.getTime() - Date.now()) / 1000);
  const tramos = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unidad, s] of tramos) {
    if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), unidad);
  }
  return 'hace un momento';
};

const fechaCompleta = (valor) => {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.getTime())) return undefined;
  return fecha.toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' });
};

const miembroDesde = (valor) => {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};

const humanizarTipo = (tipo) => {
  if (!tipo) return 'Actividad registrada';
  const texto = String(tipo).replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const iconoActividad = (tipo) => {
  const t = String(tipo ?? '').toUpperCase();
  if (t.includes('PERFIL')) return '☺';
  if (t.includes('RESENA') || t.includes('RESEÑA')) return '✎';
  if (t.includes('PUNTUAC') || t.includes('ESTRELLA')) return '★';
  if (t.includes('FAVORITO')) return '♥';
  if (t.includes('PLAYLIST')) return '☰';
  if (t.includes('BIBLIOTECA')) return '▣';
  return '♪';
};

const validar = (form) => {
  const e = {};
  const nombre = form.nombre_usuario.trim();
  if (nombre.length < 3) e.nombre_usuario = 'Usá al menos 3 caracteres.';
  else if (nombre.length > 30) e.nombre_usuario = 'Usá como máximo 30 caracteres.';

  const avatar = form.avatar_url.trim();
  if (avatar && !urlValida(avatar)) e.avatar_url = 'Ingresá una URL válida que empiece con http:// o https://';

  if (form.bio.length > MAX_BIO) e.bio = `Máximo ${MAX_BIO} caracteres.`;
  return e;
};

const sincronizarSesion = (perfil) => {
  try {
    const actual = JSON.parse(localStorage.getItem('usuario')) ?? {};
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        ...actual,
        nombre_usuario: perfil.nombre_usuario,
        avatar_url: perfil.avatar_url || null,
      })
    );
    // El Header escucha este evento para actualizar nombre y foto
    window.dispatchEvent(new Event('storage'));
  } catch {
    /* si falla, el Header se actualiza en la próxima carga */
  }
};

// ---------- componentes chicos ----------
const Avatar = ({ src, nombre }) => {
  const [falla, setFalla] = useState(false);
  const inicial = nombre?.trim()?.charAt(0)?.toUpperCase() || '♪';
  return (
    <div className="perfil-avatar">
      {src && !falla ? <img src={src} alt="" onError={() => setFalla(true)} /> : <span aria-hidden="true">{inicial}</span>}
    </div>
  );
};

// ---------- vista ----------
const Perfil = () => {
  const location = useLocation();
  const logueado = !!localStorage.getItem('token');

  // perfil
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [lento, setLento] = useState(false);
  const [error, setError] = useState(null);
  const [reintentos, setReintentos] = useState(0);

  // actividad
  const [actividad, setActividad] = useState(null);
  const [cargandoAct, setCargandoAct] = useState(true);
  const [errorAct, setErrorAct] = useState(null);
  const [limite, setLimite] = useState(LIMITE_INICIAL);
  const [recargaAct, setRecargaAct] = useState(0);

  // edición
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre_usuario: '', avatar_url: '', bio: '' });
  const [generos, setGeneros] = useState([]);
  const [nuevoGenero, setNuevoGenero] = useState('');
  const [tocados, setTocados] = useState({});
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const [aviso, setAviso] = useState(null);

  // ----- carga del perfil -----
  useEffect(() => {
    if (!logueado) return undefined;
    const controller = new AbortController();
    const avisoLento = setTimeout(() => setLento(true), 5000);

    setCargando(true);
    setLento(false);
    setError(null);

    API.get('/auth/profile', { signal: controller.signal })
      .then((res) => setPerfil(desenvolver(res.data)))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        console.error('Error al cargar el perfil:', err);
        setError(
          err.response?.data?.message ||
            'No pudimos cargar tu perfil. Si el servidor estaba dormido, puede tardar un poco: probá de nuevo.'
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
  }, [logueado, reintentos]);

  // ----- carga de la actividad (independiente del perfil) -----
  useEffect(() => {
    if (!logueado) return undefined;
    const controller = new AbortController();

    setCargandoAct(true);
    setErrorAct(null);

    API.get('/actividad', { params: { limit: limite }, signal: controller.signal })
      .then((res) => setActividad(normalizarLista(res.data)))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        console.error('Error al cargar la actividad:', err);
        setErrorAct('No pudimos cargar tu actividad.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoAct(false);
      });

    return () => controller.abort();
  }, [logueado, limite, recargaAct]);

  // ----- aviso temporal -----
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // ----- derivados -----
  const prefs = useMemo(() => leerPreferencias(perfil?.preferencias), [perfil]);
  const errores = useMemo(() => validar(form), [form]);

  const cambios = useMemo(() => {
    if (!perfil || !editando) return {};
    const c = {};
    const nombre = form.nombre_usuario.trim();
    const avatar = form.avatar_url.trim();
    const bio = form.bio.trim();

    if (nombre !== (perfil.nombre_usuario ?? '')) c.nombre_usuario = nombre;
    if (avatar !== (perfil.avatar_url ?? '')) c.avatar_url = avatar;
    if (bio !== (perfil.bio ?? '')) c.bio = bio;
    if (JSON.stringify(generos) !== JSON.stringify(prefs.generos)) {
      c.preferencias = serializarPreferencias(prefs, generos);
    }
    return c;
  }, [perfil, editando, form, generos, prefs]);

  const hayCambios = Object.keys(cambios).length > 0;
  const verError = (campo) => (tocados[campo] || intentado ? errores[campo] : undefined);

  // ----- acciones -----
  const abrirEdicion = () => {
    setForm({
      nombre_usuario: perfil.nombre_usuario ?? '',
      avatar_url: perfil.avatar_url ?? '',
      bio: perfil.bio ?? '',
    });
    setGeneros(prefs.generos);
    setNuevoGenero('');
    setTocados({});
    setIntentado(false);
    setErrorForm(null);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    if (guardando) return;
    setEditando(false);
    setErrorForm(null);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorForm(null);
  };

  const onBlur = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }));

  const agregarGenero = (texto) => {
    const limpio = texto.trim().replace(/,+$/, '').slice(0, 24);
    if (!limpio) return;
    setGeneros((g) =>
      g.length >= MAX_GENEROS || g.some((x) => x.toLowerCase() === limpio.toLowerCase()) ? g : [...g, limpio]
    );
    setNuevoGenero('');
  };

  const onKeyGenero = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      agregarGenero(nuevoGenero);
    } else if (e.key === 'Backspace' && !nuevoGenero) {
      setGeneros((g) => g.slice(0, -1));
    }
  };

  const quitarGenero = (genero) => setGeneros((g) => g.filter((x) => x !== genero));

  const guardar = async (e) => {
    e.preventDefault();
    if (guardando) return;

    setIntentado(true);
    const primerInvalido = ['nombre_usuario', 'avatar_url', 'bio'].find((c) => errores[c]);
    if (primerInvalido) {
      document.getElementById(`pf-${primerInvalido}`)?.focus();
      return;
    }
    if (!hayCambios) {
      setEditando(false);
      return;
    }

    setGuardando(true);
    setErrorForm(null);
    try {
      const { data } = await API.put('/auth/profile', cambios);
      const devuelto = desenvolver(data);
      const nuevo = {
        ...perfil,
        ...cambios,
        ...(devuelto && typeof devuelto === 'object' && devuelto.nombre_usuario ? devuelto : {}),
      };
      setPerfil(nuevo);
      sincronizarSesion(nuevo);
      setEditando(false);
      setAviso({ texto: 'Perfil actualizado.', variante: 'ok' });
      setRecargaAct((n) => n + 1); // el backend registra PERFIL_ACTUALIZADO
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      setErrorForm(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  if (!logueado) return <Navigate to="/login" state={{ from: location }} replace />;

  const desde = miembroDesde(perfil?.fecha_registro ?? perfil?.created_at ?? perfil?.creado_en);
  const avatarPrevia = form.avatar_url.trim();
  const puedeVerMas = actividad && actividad.length >= limite && limite < LIMITE_MAXIMO;

  // ---------- render ----------
  return (
    <div className="perfil-container">
      <Header />

      <main className="perfil-main">
        {error ? (
          <div className="perfil-estado" role="alert">
            <p>{error}</p>
            <button type="button" className="perfil-btn" onClick={() => setReintentos((n) => n + 1)}>
              Reintentar
            </button>
          </div>
        ) : cargando || !perfil ? (
          <>
            <div className="perfil-layout" aria-hidden="true">
              <section className="perfil-card">
                <div className="perfil-banner" />
                <div className="perfil-card-body">
                  <div className="perfil-skeleton is-avatar" />
                  <div className="perfil-skeleton is-line is-title" />
                  <div className="perfil-skeleton is-line" />
                  <div className="perfil-skeleton is-line is-short" />
                </div>
              </section>
              <section className="perfil-actividad">
                <div className="perfil-skeleton is-line is-title" />
                <div className="perfil-skeleton is-line" />
                <div className="perfil-skeleton is-line" />
                <div className="perfil-skeleton is-line is-short" />
              </section>
            </div>
            {lento && <p className="perfil-aviso-lento">El servidor está despertando, puede tardar hasta un minuto...</p>}
          </>
        ) : (
          <div className="perfil-layout">
            {/* ---------- Tarjeta del perfil ---------- */}
            <section className="perfil-card">
              <div className="perfil-banner" aria-hidden="true" />

              <div className="perfil-card-body">
                <Avatar
                  key={editando ? `edit-${avatarPrevia}` : `ver-${perfil.avatar_url ?? ''}`}
                  src={editando ? avatarPrevia : perfil.avatar_url}
                  nombre={editando ? form.nombre_usuario : perfil.nombre_usuario}
                />

                {!editando ? (
                  <>
                    <h1 className="perfil-nombre">{perfil.nombre_usuario}</h1>
                    {perfil.correo && <p className="perfil-correo">{perfil.correo}</p>}
                    {desde && <p className="perfil-desde">Miembro desde {desde}</p>}

                    <div className="perfil-bloque">
                      <h2>Sobre mí</h2>
                      {perfil.bio ? (
                        <p className="perfil-bio">{perfil.bio}</p>
                      ) : (
                        <p className="perfil-vacio">Todavía no escribiste nada sobre vos.</p>
                      )}
                    </div>

                    <div className="perfil-bloque">
                      <h2>Géneros favoritos</h2>
                      {prefs.generos.length ? (
                        <ul className="perfil-chips">
                          {prefs.generos.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="perfil-vacio">Todavía no elegiste géneros.</p>
                      )}
                    </div>

                    <button type="button" className="perfil-btn" onClick={abrirEdicion}>
                      Editar perfil
                    </button>
                  </>
                ) : (
                  <form className="perfil-form" onSubmit={guardar} noValidate>
                    <h1 className="perfil-form-titulo">Editar perfil</h1>

                    {errorForm && (
                      <p className="perfil-error" role="alert">
                        {errorForm}
                      </p>
                    )}

                    <div className={`perfil-campo ${verError('nombre_usuario') ? 'has-error' : ''}`}>
                      <label htmlFor="pf-nombre_usuario">Nombre de usuario</label>
                      <input
                        id="pf-nombre_usuario"
                        name="nombre_usuario"
                        type="text"
                        value={form.nombre_usuario}
                        onChange={onChange}
                        onBlur={onBlur}
                        maxLength={30}
                        autoComplete="username"
                        disabled={guardando}
                        aria-invalid={!!verError('nombre_usuario')}
                        autoFocus
                      />
                      {verError('nombre_usuario') && <p className="perfil-campo-error">{errores.nombre_usuario}</p>}
                    </div>

                    <div className={`perfil-campo ${verError('avatar_url') ? 'has-error' : ''}`}>
                      <label htmlFor="pf-avatar_url">Foto de perfil (URL)</label>
                      <input
                        id="pf-avatar_url"
                        name="avatar_url"
                        type="url"
                        value={form.avatar_url}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="https://..."
                        autoComplete="off"
                        disabled={guardando}
                        aria-invalid={!!verError('avatar_url')}
                      />
                      {verError('avatar_url') ? (
                        <p className="perfil-campo-error">{errores.avatar_url}</p>
                      ) : (
                        <p className="perfil-ayuda">Dejalo vacío para usar tu inicial.</p>
                      )}
                    </div>

                    <div className={`perfil-campo ${verError('bio') ? 'has-error' : ''}`}>
                      <label htmlFor="pf-bio">Sobre mí</label>
                      <textarea
                        id="pf-bio"
                        name="bio"
                        rows={4}
                        value={form.bio}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Contá qué música te mueve..."
                        disabled={guardando}
                        aria-invalid={!!verError('bio')}
                      />
                      <p className={`perfil-contador ${form.bio.length > MAX_BIO ? 'is-excedido' : ''}`}>
                        {form.bio.length}/{MAX_BIO}
                      </p>
                      {verError('bio') && <p className="perfil-campo-error">{errores.bio}</p>}
                    </div>

                    <div className="perfil-campo">
                      <label htmlFor="pf-generos">Géneros favoritos</label>
                      <div className="perfil-generos-input">
                        {generos.map((g) => (
                          <span key={g} className="perfil-chip-edit">
                            {g}
                            <button
                              type="button"
                              onClick={() => quitarGenero(g)}
                              aria-label={`Quitar ${g}`}
                              disabled={guardando}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {generos.length < MAX_GENEROS && (
                          <input
                            id="pf-generos"
                            type="text"
                            value={nuevoGenero}
                            onChange={(e) => setNuevoGenero(e.target.value)}
                            onKeyDown={onKeyGenero}
                            onBlur={() => agregarGenero(nuevoGenero)}
                            placeholder={generos.length ? '' : 'Escribí y apretá Enter'}
                            maxLength={24}
                            disabled={guardando}
                          />
                        )}
                      </div>

                      {generos.length < MAX_GENEROS && (
                        <div className="perfil-sugerencias">
                          {SUGERENCIAS.filter((s) => !generos.some((g) => g.toLowerCase() === s)).map((s) => (
                            <button key={s} type="button" onClick={() => agregarGenero(s)} disabled={guardando}>
                              + {s}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="perfil-ayuda">Hasta {MAX_GENEROS} géneros.</p>
                    </div>

                    <div className="perfil-form-botones">
                      <button type="button" className="perfil-btn is-outline" onClick={cancelarEdicion} disabled={guardando}>
                        Cancelar
                      </button>
                      <button type="submit" className="perfil-btn" disabled={guardando || !hayCambios}>
                        {guardando && <span className="perfil-spinner" aria-hidden="true" />}
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* ---------- Actividad ---------- */}
            <section className="perfil-actividad" aria-labelledby="perfil-act-titulo">
              <h2 id="perfil-act-titulo" className="perfil-act-titulo">
                Actividad reciente
              </h2>

              {errorAct ? (
                <div className="perfil-act-estado" role="alert">
                  <p>{errorAct}</p>
                  <button type="button" className="perfil-btn is-small" onClick={() => setRecargaAct((n) => n + 1)}>
                    Reintentar
                  </button>
                </div>
              ) : actividad === null ? (
                <div aria-hidden="true">
                  <div className="perfil-skeleton is-line" />
                  <div className="perfil-skeleton is-line" />
                  <div className="perfil-skeleton is-line is-short" />
                </div>
              ) : actividad.length === 0 ? (
                <p className="perfil-act-vacio">Todavía no hay actividad. Explorá música y guardá tus primeros favoritos.</p>
              ) : (
                <>
                  <ul className="perfil-act-lista">
                    {actividad.map((a, i) => {
                      const tipo = a.tipo_accion ?? a.tipo ?? a.accion;
                      const cuando = a.fecha ?? a.created_at ?? a.fecha_creacion ?? a.creado_en;
                      return (
                        <li key={a.id ?? i} className="perfil-act-item">
                          <span className="perfil-act-icono" aria-hidden="true">
                            {iconoActividad(tipo)}
                          </span>
                          <div className="perfil-act-texto">
                            <p>{a.descripcion ?? a.detalle ?? humanizarTipo(tipo)}</p>
                            {cuando && (
                              <time dateTime={new Date(cuando).toISOString?.()} title={fechaCompleta(cuando)}>
                                {tiempoRelativo(cuando)}
                              </time>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {puedeVerMas && (
                    <div className="perfil-act-mas">
                      <button
                        type="button"
                        className="perfil-btn is-outline is-small"
                        onClick={() => setLimite((l) => Math.min(l + LIMITE_INICIAL, LIMITE_MAXIMO))}
                        disabled={cargandoAct}
                      >
                        {cargandoAct ? 'Cargando...' : 'Ver más'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {aviso && (
        <div className="perfil-toast" role="status" aria-live="polite">
          {aviso.texto}
        </div>
      )}
    </div>
  );
};

export default Perfil;