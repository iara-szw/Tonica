import express from 'express';
import authJWT from '../middleware/authJWT.js';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/estadisticas -> El endpoint real protegido para React
router.get('/', authJWT, async (req, res) => {
  const id_usuario = req.user.id; // Tomamos el ID real del usuario logueado

  const query = `
    SELECT 
      COUNT(*)::INT AS total_canciones,
      COALESCE(
        (SELECT JSON_OBJECT_AGG(estado::text, conteo)
         FROM (
           SELECT estado, COUNT(*)::INT AS conteo
           FROM items_biblioteca
           WHERE id_usuario = $1
           GROUP BY estado
         ) sub),
        '{}'::json
      ) AS estados_escucha,
      ROUND(COALESCE(AVG(puntuacion), 0), 1)::FLOAT AS promedio_puntuacion,
      ROUND(COALESCE(SUM(c.duracion_seg), 0) / 60)::INT AS tiempo_total_minutos,
      COALESCE(
        (SELECT c2.genero FROM items_biblioteca ib2
         JOIN canciones c2 ON ib2.id_cancion = c2.id
         WHERE ib2.id_usuario = $1 AND c2.genero IS NOT NULL AND c2.genero != 'General'
         GROUP BY c2.genero ORDER BY COUNT(*) DESC LIMIT 1), 
        'Ninguno'
      ) AS genero_predominante,
      COALESCE(
        (SELECT c3.nombre_artista FROM items_biblioteca ib3
         JOIN canciones c3 ON ib3.id_cancion = c3.id
         WHERE ib3.id_usuario = $1 AND c3.nombre_artista IS NOT NULL
         GROUP BY c3.nombre_artista ORDER BY COUNT(*) DESC LIMIT 1), 
        'Ninguno'
      ) AS artista_favorito
    FROM items_biblioteca ib
    JOIN canciones c ON ib.id_cancion = c.id
    WHERE ib.id_usuario = $1;
  `;

  try {
    const result = await pool.query(query, [id_usuario]);
    res.status(200).json({
      mensaje: "Estadísticas calculadas en tiempo real 📊",
      estadisticas: result.rows[0] // Mandamos el objeto directo sin array
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
