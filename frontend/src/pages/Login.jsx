import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/apiClient';
import '../style/login.css';

const DEMO = { correo: 'demo@tonica.com', password: 'demo1234' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALORES_INICIALES = { nombre_usuario: '', correo: '', password: '', confirmPassword: '' };
const ORDEN_CAMPOS = {
  login: ['correo', 'password'],
  registro: ['nombre_usuario', 'correo', 'password', 'confirmPassword'],
};

// ---------- helpers ----------
const validar = (modo, v) => {
  const e = {};

  if (modo === 'registro') {
    const nombre = v.nombre_usuario.trim();
    if (nombre.length < 3) e.nombre_usuario = 'Usá al menos 3 caracteres.';
    else if (nombre.length > 30) e.nombre_usuario = 'Usá como máximo 30 caracteres.';
  }

  if (!v.correo.trim()) e.correo = 'Ingresá tu correo.';
  else if (!EMAIL_RE.test(v.correo.trim())) e.correo = 'Ingresá un correo válido.';

  if (!v.password) e.password = 'Ingresá tu contraseña.';
  else if (modo === 'registro' && v.password.length < 6) e.password = 'Usá al menos 6 caracteres.';

  if (modo === 'registro') {
    if (!v.confirmPassword) e.confirmPassword = 'Repetí tu contraseña.';
    else if (v.confirmPassword !== v.password) e.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return e;
};

const mensajeError = (err) => {
  if (err.response) {
    const d = err.response.data;
    return (
      d?.message ||
      d?.error ||
      (typeof d === 'string' && d) ||
      'No pudimos completar la operación. Probá de nuevo.'
    );
  }
  if (err.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Probá de nuevo.';
  return 'No pudimos conectar con el servidor. Revisá tu conexión.';
};

// ---------- componentes chicos ----------
const IconoOjo = ({ tachado }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    {tachado && <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
  </svg>
);

const Campo = ({ name, etiqueta, error, lateral, ...inputProps }) => {
  const id = `lg-${name}`;
  return (
    <div className={`login-campo ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="login-input-wrap">
        <input
          id={id}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {lateral}
      </div>
      {error && (
        <p id={`${id}-error`} className="login-campo-error">
          {error}
        </p>
      )}
    </div>
  );
};

// ---------- vista ----------
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from;
  const destino = from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';

  const [modo, setModo] = useState(location.pathname.includes('registro') ? 'registro' : 'login');
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [tocados, setTocados] = useState({});
  const [intentado, setIntentado] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [lento, setLento] = useState(false);
  const [errorForm, setErrorForm] = useState(null);
  const [aviso, setAviso] = useState(null);

  const errores = useMemo(() => validar(modo, valores), [modo, valores]);
  const esRegistro = modo === 'registro';

  // aviso de Render dormido
  useEffect(() => {
    if (!enviando) {
      setLento(false);
      return undefined;
    }
    const t = setTimeout(() => setLento(true), 5000);
    return () => clearTimeout(t);
  }, [enviando]);

  // ya hay sesión: no tiene sentido mostrar el login
  if (localStorage.getItem('token') && !enviando) {
    return <Navigate to={destino} replace />;
  }

  const verError = (campo) => (tocados[campo] || intentado ? errores[campo] : undefined);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValores((v) => ({ ...v, [name]: value }));
    setErrorForm(null);
  };

  const onBlur = (e) => setTocados((t) => ({ ...t, [e.target.name]: true }));

  const cambiarModo = (nuevo) => {
    if (nuevo === modo || enviando) return;
    setModo(nuevo);
    setTocados({});
    setIntentado(false);
    setErrorForm(null);
    setAviso(null);
    setVerPassword(false);
    setValores((v) => ({ ...v, password: '', confirmPassword: '' }));
  };

  // ----- llamadas al backend -----
  const abrirSesion = async (correo, password) => {
    const { data } = await API.post('/auth/login', { correo: correo.trim(), password });
    if (!data?.token) throw new Error('Respuesta de login sin token.');
    localStorage.setItem('token', data.token);
    const usuario = data.user ?? data.usuario;
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario));
  };

  const ejecutar = async (accion) => {
    setEnviando(true);
    setErrorForm(null);
    setAviso(null);
    try {
      await accion();
    } catch (err) {
      console.error('Error de autenticación:', err);
      setErrorForm(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const iniciarSesion = (correo, password) =>
    ejecutar(async () => {
      await abrirSesion(correo, password);
      navigate(destino, { replace: true });
    });

  const registrar = () =>
    ejecutar(async () => {
      await API.post('/auth/register', {
        nombre_usuario: valores.nombre_usuario.trim(),
        correo: valores.correo.trim(),
        password: valores.password,
        confirmPassword: valores.confirmPassword,
      });

      try {
        await abrirSesion(valores.correo, valores.password);
      } catch (err) {
        // La cuenta se creó pero no pudimos entrar solos: pasamos a "Ingresar"
        setModo('login');
        setTocados({});
        setIntentado(false);
        setValores((v) => ({ ...v, nombre_usuario: '', password: '', confirmPassword: '' }));
        setAviso('Cuenta creada con éxito. Ingresá con tu correo y contraseña.');
        return;
      }
      navigate(destino, { replace: true });
    });

  const onSubmit = (e) => {
    e.preventDefault();
    if (enviando) return;

    setIntentado(true);
    const primerInvalido = ORDEN_CAMPOS[modo].find((c) => errores[c]);
    if (primerInvalido) {
      document.getElementById(`lg-${primerInvalido}`)?.focus();
      return;
    }

    if (esRegistro) registrar();
    else iniciarSesion(valores.correo, valores.password);
  };

  const usarDemo = () => {
    if (enviando) return;
    setModo('login');
    setTocados({});
    setIntentado(false);
    setValores((v) => ({ ...v, ...DEMO }));
    iniciarSesion(DEMO.correo, DEMO.password);
  };

  const botonTexto = enviando
    ? esRegistro
      ? 'Creando cuenta...'
      : 'Ingresando...'
    : esRegistro
      ? 'Crear cuenta'
      : 'Ingresar';

  const botonPassword = (
    <button
      type="button"
      className="login-ojo"
      onClick={() => setVerPassword((v) => !v)}
      aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={verPassword}
      tabIndex={-1}
    >
      <IconoOjo tachado={verPassword} />
    </button>
  );

  return (
    <div className="login-container">
      <aside className="login-brand">
        <div className="login-logo">
          <span aria-hidden="true">◎</span> TÓNICA
        </div>

        <div className="login-disc" aria-hidden="true" />

        <p className="login-lema">
          Tu música, tu biblioteca
          <br />y tus estadísticas, en un solo lugar.
        </p>
      </aside>

      <main className="login-panel">
        <section className="login-card">
          <div className="login-tabs" role="tablist" aria-label="Acceso">
            <button
              type="button"
              role="tab"
              aria-selected={!esRegistro}
              className={`login-tab ${!esRegistro ? 'is-active' : ''}`}
              onClick={() => cambiarModo('login')}
            >
              Ingresar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={esRegistro}
              className={`login-tab ${esRegistro ? 'is-active' : ''}`}
              onClick={() => cambiarModo('registro')}
            >
              Crear cuenta
            </button>
          </div>

          <h1 className="login-titulo">{esRegistro ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p className="login-subtitulo">
            {esRegistro
              ? 'Armá tu biblioteca, reseñá lo que escuchás y mirá tus estadísticas.'
              : 'Ingresá para ver tu biblioteca, tus playlists y tus reseñas.'}
          </p>

          {aviso && (
            <p className="login-aviso" role="status">
              {aviso}
            </p>
          )}
          {errorForm && (
            <p className="login-error" role="alert">
              {errorForm}
            </p>
          )}

          <form className="login-form" onSubmit={onSubmit} noValidate>
            {esRegistro && (
              <Campo
                name="nombre_usuario"
                etiqueta="Nombre de usuario"
                type="text"
                value={valores.nombre_usuario}
                onChange={onChange}
                onBlur={onBlur}
                error={verError('nombre_usuario')}
                autoComplete="username"
                maxLength={30}
                placeholder="tu_usuario"
                disabled={enviando}
                autoFocus
              />
            )}

            <Campo
              name="correo"
              etiqueta="Correo electrónico"
              type="email"
              value={valores.correo}
              onChange={onChange}
              onBlur={onBlur}
              error={verError('correo')}
              autoComplete="email"
              placeholder="vos@correo.com"
              disabled={enviando}
              autoFocus={!esRegistro}
            />

            <Campo
              name="password"
              etiqueta="Contraseña"
              type={verPassword ? 'text' : 'password'}
              value={valores.password}
              onChange={onChange}
              onBlur={onBlur}
              error={verError('password')}
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              placeholder={esRegistro ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
              disabled={enviando}
              lateral={botonPassword}
            />

            {esRegistro && (
              <Campo
                name="confirmPassword"
                etiqueta="Repetir contraseña"
                type={verPassword ? 'text' : 'password'}
                value={valores.confirmPassword}
                onChange={onChange}
                onBlur={onBlur}
                error={verError('confirmPassword')}
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                disabled={enviando}
              />
            )}

            <button type="submit" className="login-submit" disabled={enviando}>
              {enviando && <span className="login-spinner" aria-hidden="true" />}
              {botonTexto}
            </button>

            {enviando && lento && (
              <p className="login-lento" role="status">
                El servidor está despertando, puede tardar hasta un minuto...
              </p>
            )}
          </form>

          <div className="login-separador">
            <span>o</span>
          </div>

          <button type="button" className="login-demo" onClick={usarDemo} disabled={enviando}>
            Probar con la cuenta demo
          </button>

          <p className="login-cambio">
            {esRegistro ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
            <button type="button" onClick={() => cambiarModo(esRegistro ? 'login' : 'registro')} disabled={enviando}>
              {esRegistro ? 'Ingresá' : 'Registrate'}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;