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
import pool from '../config/db.js'; // <-- Asegurate de que esté importado tu pool

router.get('/test-stats', async (req, res) => {
  const id_usuario_prueba = 1; 

  const query = `
    SELECT 
      -- 1. Total de canciones
      COUNT(*)::INT AS total_canciones,
      
      -- 2. Conteo dinámico agrupado por cualquier estado que tenga tu ENUM actual
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

      -- 3. Promedio general de puntuaciones
      ROUND(COALESCE(AVG(puntuacion), 0), 1)::FLOAT AS promedio_puntuacion,

      -- 4. Tiempo total acumulado en minutos
      ROUND(COALESCE(SUM(c.duracion_seg), 0) / 60)::INT AS tiempo_total_minutos,

      -- 5. Género musical predominante
      COALESCE(
        (SELECT c2.genero FROM items_biblioteca ib2
         JOIN canciones c2 ON ib2.id_cancion = c2.id
         WHERE ib2.id_usuario = $1 AND c2.genero IS NOT NULL AND c2.genero != 'General'
         GROUP BY c2.genero ORDER BY COUNT(*) DESC LIMIT 1), 
        'Ninguno'
      ) AS genero_predominante,

      -- 6. Artista que más se repite
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
    const result = await pool.query(query, [id_usuario_prueba]);
    res.status(200).json({
      mensaje: "¡Query SQL de Estadísticas verificada dinámicamente! 📊",
      estadisticas: result.rows[0] // Mandamos el objeto directo sin array molesto
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
