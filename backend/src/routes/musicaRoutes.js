import express from 'express';
import { musicService } from '../services/ApiMusic.js'; 
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'El parámetro de búsqueda "q" es obligatorio.' });
  }

  try {
    const results = await musicService.searchArtists(q);
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
