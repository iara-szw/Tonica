import express from 'express';
import NodeCache from 'node-cache';
import { musicService } from '../services/ApiMusic.js';

const router = express.Router();

// Configurar caché para guardar respuestas por 24 horas (86400 segundos)
const apiCache = new NodeCache({ stdTTL: 86400 });

router.get('/search', async (req, res) => {
  const { q, type } = req.query;

  if (!q || !q.trim()) {
    return res.status(200).json([]);
  }

  const searchType = type || 'track';
  // Crear una clave única para esta búsqueda exacta, ej: "search-track-radiohead"
  const cacheKey = `search-${searchType}-${q.toLowerCase().trim()}`;

  // 1. Si ya se buscó antes, devolver inmediatamente desde la caché local
  if (apiCache.has(cacheKey)) {
    console.log(`Devolviendo búsqueda desde caché: ${cacheKey}`);
    return res.status(200).json(apiCache.get(cacheKey));
  }

  try {
    // 2. Si es nueva, ir a buscar a MusicBrainz (o servicio externo)
    const resultados = await musicService.searchMusic(q, searchType);
    
    // 3. Guardar el resultado en caché y luego devolverlo
    apiCache.set(cacheKey, resultados);
    res.status(200).json(resultados);
  } catch (err) {
    const isRateLimit = err.message.includes('saturado') || err.response?.status === 503 || err.response?.status === 429;
    res.status(isRateLimit ? 503 : 500).json({ error: err.message });
  }
});

router.get('/detalle/:type/:id', async (req, res) => {
  const { id, type } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'El parámetro de búsqueda "id" es obligatorio.' });
  }

  const detailType = type || 'track';
  // Crear una clave única para este detalle exacto
  const cacheKey = `detalle-${detailType}-${id}`;

  // 1. Si ya se consultó este detalle antes, devolver desde la caché local
  if (apiCache.has(cacheKey)) {
    console.log(`Devolviendo detalle desde caché: ${cacheKey}`);
    return res.status(200).json(apiCache.get(cacheKey));
  }

  try {
    // 2. Si es nuevo, ir a buscar a MusicBrainz
    const resultados = await musicService.searchById(id, detailType);
    
    // 3. Guardar el resultado en caché
    apiCache.set(cacheKey, resultados);
    res.status(200).json(resultados);
  } catch (err) {
    const isRateLimit = err.message.includes('saturado') || err.response?.status === 503 || err.response?.status === 429;
    res.status(isRateLimit ? 503 : 500).json({ error: err.message });
  }
});

export default router;