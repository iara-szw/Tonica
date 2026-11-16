import express from 'express';
import authJWT from '../middleware/authJWT.js';
import { bibliotecaService } from '../services/bibliotecaService.js';

const router = express.Router();

router.post('/', authJWT, async (req, res) => {
  const id_externo = req.body.id_externo || req.body.musica?.id_externo;
  const tipo = req.body.tipo || req.body.musica?.tipo || 'track';
  const interact = req.body.interact || {
    estado: req.body.estado,
    es_favorito: req.body.es_favorito,
    puntuacion: req.body.puntuacion,
    resena: req.body.resena
  };

  if (!id_externo) {
    return res.status(400).json({ error: 'El campo id_externo es obligatorio.' });
  }

  try {
    const resultado = await bibliotecaService.guardarInteraccionMusica(
      req.user.id,
      { id_externo, tipo },
      interact
    );
    return res.status(200).json(resultado);
  } catch (err) {
    const status = err.message.includes('no existe') ? 404 : 400;
    return res.status(status).json({ error: err.message });
  }
});

router.get('/', authJWT, async (req, res) => {
  const id_usuario = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const resultado = await bibliotecaService.verBiblioteca(id_usuario);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id_cancion/resena', authJWT, async (req, res) => {
  try {
    const item = await bibliotecaService.guardarResena(
      req.user.id,
      req.params.id_cancion,
      req.body.resena
    );
    res.status(200).json({ mensaje: 'Reseña guardada con éxito ✍️', item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/:id_cancion/resena', authJWT, async (req, res) => {
  try {
    const resultado = await bibliotecaService.borrarResena(req.user.id, req.params.id_cancion);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/:id_cancion', authJWT, async (req, res) => {
  try {
    const resultado = await bibliotecaService.eliminarDeBiblioteca(req.user.id, req.params.id_cancion);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
export default router;
