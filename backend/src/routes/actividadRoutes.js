import express from 'express';
import authJWT from '../middleware/authJWT.js';
import actividadRepository from '../repositories/actividadRepository.js';

const router = express.Router();

// GET /api/actividad -> Obtener actividad reciente del usuario
router.get('/', authJWT, async (req, res) => {
  try {
    const limite = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const actividad = await actividadRepository.obtenerRecientePorUsuario(req.user.id, limite);
    res.status(200).json(actividad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;