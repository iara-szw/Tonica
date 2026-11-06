import pool from '../config/db.js';

const playlistRepository = {
  // Obtener todas las playlists de un usuario con el conteo de ítems
  obtenerTodasPorUsuario: async (id_usuario) => {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.creado_en,
        COUNT(pi.id_cancion)::INT AS total_canciones
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.id_playlist
      WHERE p.id_usuario = $1
      GROUP BY p.id
      ORDER BY p.creado_en DESC;
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows;
  },

  // Obtener detalle de una playlist con sus canciones asociadas
  obtenerPorId: async (id_playlist, id_usuario) => {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.creado_en,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id_cancion', c.id,
              'id_externo', c.id_externo,
              'titulo', c.titulo,
              'nombre_artista', c.nombre_artista,
              'genero', c.genero,
              'duracion_seg', c.duracion_seg,
              'agregado_en', pi.agregado_en
            )
          ) FILTER (WHERE c.id IS NOT NULL), '[]'::json
        ) AS canciones
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.id_playlist
      LEFT JOIN canciones c ON pi.id_cancion = c.id
      WHERE p.id = $1 AND p.id_usuario = $2
      GROUP BY p.id;
    `;
    const result = await pool.query(query, [id_playlist, id_usuario]);
    return result.rows[0];
  },

  // Crear una nueva playlist vacía
  crear: async (id_usuario, nombre, descripcion) => {
    const query = `
      INSERT INTO playlists (id_usuario, nombre, descripcion, creado_en)
      VALUES ($1, $2, $3, now())
      RETURNING *;
    `;
    const result = await pool.query(query, [id_usuario, nombre, descripcion || null]);
    return result.rows[0];
  },

  // Eliminar playlist de la base de datos
  eliminar: async (id_playlist, id_usuario) => {
    const query = `
      DELETE FROM playlists
      WHERE id = $1 AND id_usuario = $2
      RETURNING id;
    `;
    const result = await pool.query(query, [id_playlist, id_usuario]);
    return result.rows[0];
  },

  // Agregar una canción a la playlist
  agregarCancion: async (id_playlist, id_cancion) => {
    const query = `
      INSERT INTO playlist_items (id_playlist, id_cancion, agregado_en)
      VALUES ($1, $2, now())
      ON CONFLICT (id_playlist, id_cancion) DO NOTHING
      RETURNING *;
    `;
    const result = await pool.query(query, [id_playlist, id_cancion]);
    return result.rows[0];
  },

  // Eliminar una canción de la playlist
  quitarCancion: async (id_playlist, id_cancion) => {
    const query = `
      DELETE FROM playlist_items
      WHERE id_playlist = $1 AND id_cancion = $2
      RETURNING id_cancion;
    `;
    const result = await pool.query(query, [id_playlist, id_cancion]);
    return result.rows[0];
  }
};

export default playlistRepository;