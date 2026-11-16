import express from 'express';
import authService from '../services/authService.js';
import authJWT from '../middleware/authJWT.js';

const router = express.Router();

const normalizarString = (valor) => (typeof valor === 'string' ? valor.trim() : valor);

router.post('/register', async (req, res) => {
  const nombre_usuario = normalizarString(req.body.nombre_usuario);
  const correo = normalizarString(req.body.correo);
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  if (!nombre_usuario || !correo || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  if (nombre_usuario.length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  try {
    const user = await authService.register(nombre_usuario, correo, password);
    return res.status(201).json({ mensaje: 'Usuario registrado con éxito 🚀', user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const correo = normalizarString(req.body.correo);
  const password = req.body.password;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const data = await authService.login(correo, password);
    return res.json({ mensaje: 'Login exitoso 🎉', ...data });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

router.get('/me', authJWT, (req, res) => {
  res.json({ mensaje: 'Sesión activa con el backend 🟢', user: req.user });
});

router.get('/perfil', authJWT, async (req, res) => {
  try {
    const perfil = await authService.obtenerPerfil(req.user.id);
    return res.status(200).json(perfil);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

router.put('/perfil', authJWT, async (req, res) => {
  const { nombre_usuario, avatar_url, bio, preferencias } = req.body;

  if (
    nombre_usuario === undefined &&
    avatar_url === undefined &&
    bio === undefined &&
    preferencias === undefined
  ) {
    return res.status(400).json({ error: 'Debes enviar al menos un campo para actualizar.' });
  }

  try {
    const perfil = await authService.actualizarPerfil(req.user.id, {
      nombre_usuario,
      avatar_url,
      bio,
      preferencias
    });
    return res.status(200).json({ mensaje: 'Perfil actualizado con éxito ✨', perfil });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
