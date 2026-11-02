import express from 'express';
import authService from '../services/authService.js';
import authJWT from '../middleware/authJWT.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nombre_usuario, correo, password, confirmPassword } = req.body;

  if (!nombre_usuario || !correo || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }

  try {
    const user = await authService.register(nombre_usuario, correo, password);
    res.status(201).json({ mensaje: 'Usuario registrado con éxito 🚀', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  try {
    const data = await authService.login(correo, password);
    res.json({ mensaje: 'Login exitoso 🎉', ...data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authJWT, (req, res) => {
  res.json({ mensaje: 'Sesión activa con el backend 🟢', user: req.user });
});

export default router;
