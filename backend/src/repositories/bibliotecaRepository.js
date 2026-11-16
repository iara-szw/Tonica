import pool from '../config/db.js';

const bibliotecaRepository = {
  // Buscar si la canción ya existe en nuestra caché local
  buscarMusicaPorIdExterno: async (id_externo) => {
    const query = 'SELECT * FROM canciones WHERE id_externo = $1';
    const result = await pool.query(query, [id_externo]);
    return result.rows; // Retorna el array crudo siempre
  },

  // Guardar la canción en la caché local (tabla canciones)
  crearMusicaCache: async (musicaData) => {
    const {
      id_externo,
      fuente,
      tipo,
      titulo,
      id_artista_externo,
      id_album_externo,
      nombre_artista,
      genero,
      duracion_seg,
      portada_url
    } = musicaData;

    const query = `
      INSERT INTO canciones (
        id_externo,
        fuente,
        tipo,
        titulo,
        id_artista_externo,
        id_album_externo,
        nombre_artista,
        genero,
        duracion_seg,
        portada_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id_externo) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_externo,
      fuente || 'musicbrainz',
      tipo || 'Canción',
      titulo || 'Sin título',
      id_artista_externo || null,
      id_album_externo || null,
      nombre_artista || 'Artista desconocido',
      genero || 'General',
      duracion_seg || null,
      portada_url || null
    ]);
    return result.rows;
  },

  // Insertar o actualizar el estado en items_biblioteca
  guardarItemBiblioteca: async (id_usuario, id_cancion, estado, es_favorito, puntuacion, resena) => {
    const query = `
      INSERT INTO items_biblioteca (id_usuario, id_cancion, estado, es_favorito, puntuacion, resena, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (id_usuario, id_cancion) 
      DO UPDATE SET 
        estado = EXCLUDED.estado,
        es_favorito = EXCLUDED.es_favorito,
        puntuacion = COALESCE(EXCLUDED.puntuacion, items_biblioteca.puntuacion),
        resena = COALESCE(EXCLUDED.resena, items_biblioteca.resena),
        actualizado_en = now()
      RETURNING *
    `;
    const result = await pool.query(query, [id_usuario, id_cancion, estado, es_favorito, puntuacion, resena ?? null]);
    return result.rows; // Retorna el array crudo siempre
  },

  // Listar todos los ítems de la biblioteca del usuario con metadatos de la canción
  obtenerItemsBiblioteca: async (id_usuario) => {
    const query = `
      SELECT 
        ib.*,
        c.id_externo,
        c.fuente,
        c.titulo,
        c.nombre_artista,
        c.genero,
        c.duracion_seg,
        c.id_album_externo
      FROM items_biblioteca ib
      JOIN canciones c ON ib.id_cancion = c.id
      WHERE ib.id_usuario = $1
      ORDER BY ib.actualizado_en DESC
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows;
  },

  // Crear o editar la reseña de una canción guardada en la biblioteca del usuario
  guardarResena: async (id_usuario, id_cancion, resena) => {
    const query = `
      UPDATE items_biblioteca
      SET resena = $1, actualizado_en = now()
      WHERE id_usuario = $2 AND id_cancion = $3
      RETURNING *
    `;
    const result = await pool.query(query, [resena, id_usuario, id_cancion]);
    return result.rows[0];
  },

  // Eliminar únicamente el texto de la reseña sin quitar la canción de la biblioteca
  eliminarResena: async (id_usuario, id_cancion) => {
    const query = `
      UPDATE items_biblioteca
      SET resena = NULL, actualizado_en = now()
      WHERE id_usuario = $1 AND id_cancion = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id_usuario, id_cancion]);
    return result.rows[0];
  },

  // Quitar completamente un ítem de la biblioteca del usuario
  eliminarItemBiblioteca: async (id_usuario, id_cancion) => {
    const query = `
      DELETE FROM items_biblioteca
      WHERE id_usuario = $1 AND id_cancion = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id_usuario, id_cancion]);
    return result.rows[0];
  }
};

export default bibliotecaRepository;