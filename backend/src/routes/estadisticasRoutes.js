import express from 'express';
import authJWT from '../middleware/authJWT.js';
import estadisticasRepository from '../repositories/estadisticasRepository.js';

const router = express.Router();

router.get('/', authJWT, async (req, res) => {
  const id_usuario = req.user.id;

  try {
    const estadisticas = await estadisticasRepository.obtenerEstadisticasPorUsuario(id_usuario);
    
    res.status(200).json({
      mensaje: "Estadísticas calculadas en tiempo real 📊",
      estadisticas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;