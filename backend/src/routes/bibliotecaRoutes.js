import express from 'express';
import authJWT from '../middleware/authJWT.js';
import { bibliotecaService } from '../services/bibliotecaService.js';

const router = express.Router();

router.post('/', authJWT, async (req, res) => {
  const { musica, interact } = req.body;
  const id_usuario = req.user.id; 

  if (!musica || !musica.id_externo || !musica.titulo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios de la música (id_externo y titulo).' });
  }

  try {
    const resultado = await bibliotecaService.guardarInteraccionMusica(id_usuario, musica, interact || {});
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
