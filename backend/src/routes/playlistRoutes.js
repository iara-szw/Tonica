import express from 'express';
import authJWT from '../middleware/authJWT.js';
import { playlistService } from '../services/playlistService.js';

const router = express.Router();

// GET /api/playlists -> Obtener todas las playlists del usuario
router.get('/', authJWT, async (req, res) => {
  try {
    const playlists = await playlistService.listarPlaylistsUsuario(req.user.id);
    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/playlists/:id -> Obtener una playlist específica con sus canciones
router.get('/:id', authJWT, async (req, res) => {
  try {
    const playlist = await playlistService.obtenerDetallePlaylist(req.params.id, req.user.id);
    res.status(200).json(playlist);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/playlists -> Crear una nueva playlist
router.post('/', authJWT, async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    const nuevaPlaylist = await playlistService.crearPlaylist(req.user.id, nombre, descripcion);
    res.status(201).json({ mensaje: 'Playlist creada exitosamente 🚀', playlist: nuevaPlaylist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/playlists/:id -> Eliminar una playlist completa
router.delete('/:id', authJWT, async (req, res) => {
  try {
    const resultado = await playlistService.eliminarPlaylist(req.params.id, req.user.id);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/playlists/:id/items -> Agregar canción a una playlist
router.post('/:id/items', authJWT, async (req, res) => {
  const { musica } = req.body;
  if (!musica || !musica.id_externo || !musica.titulo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios de la música (id_externo y titulo).' });
  }

  try {
    const resultado = await playlistService.agregarCancionAPlaylist(req.params.id, req.user.id, musica);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/playlists/:id/items/:id_cancion -> Quitar canción de la playlist
router.delete('/:id/items/:id_cancion', authJWT, async (req, res) => {
  try {
    const resultado = await playlistService.quitarCancionDePlaylist(req.params.id, req.params.id_cancion, req.user.id);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;