import express from 'express';
import { musicService } from '../services/ApiMusic.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  const { q, type } = req.query; // type puede ser: 'artist', 'album', 'track'

  if (!q) {
    return res.status(400).json({ error: 'El parámetro de búsqueda "q" es obligatorio.' });
  }

  try {
    // Si no mandan tipo, por defecto busca canciones ('track')
    const resultados = await musicService.searchMusic(q, type || 'track');
    res.status(200).json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/detalle/:type/:id', async (req, res) => {
  const { id, type } = req.params; // type puede ser: 'artist', 'album', 'track'

  if (!id) {
    return res.status(400).json({ error: 'El parámetro de búsqueda "id" es obligatorio.' });
  }

  try {
    // Si no mandan tipo, por defecto busca canciones ('track')
    const resultados = await musicService.searchById(id, type || 'track');
    res.status(200).json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
