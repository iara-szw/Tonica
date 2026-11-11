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
      titulo,
      id_artista_externo,
      id_album_externo,
      nombre_artista,
      genero,
      duracion_seg
    } = musicaData;

    const query = `
      INSERT INTO canciones (
        id_externo,
        fuente,
        titulo,
        id_artista_externo,
        id_album_externo,
        nombre_artista,
        genero,
        duracion_seg
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id_externo) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_externo,
      fuente || 'external',
      titulo || 'Canción sin título',
      id_artista_externo || null,
      id_album_externo || null,
      nombre_artista || 'Artista desconocido',
      genero || 'General',
      duracion_seg || null
    ]);
    return result.rows; // Retorna el array crudo siempre
  },

  // Insertar o actualizar el estado en items_biblioteca
  guardarItemBiblioteca: async (id_usuario, id_cancion, estado, es_favorito, puntuacion) => {
    const query = `
      INSERT INTO items_biblioteca (id_usuario, id_cancion, estado, es_favorito, puntuacion, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, now())
      ON CONFLICT (id_usuario, id_cancion) 
      DO UPDATE SET 
        estado = EXCLUDED.estado,
        es_favorito = EXCLUDED.es_favorito,
        puntuacion = COALESCE(EXCLUDED.puntuacion, items_biblioteca.puntuacion),
        actualizado_en = now()
      RETURNING *
    `;
    const result = await pool.query(query, [id_usuario, id_cancion, estado, es_favorito, puntuacion]);
    return result.rows; // Retorna el array crudo siempre
  }

  , obtenerItemsBiblioteca: async (id_usuario) => {
    const query = `
      SELECT ib.*, c.titulo, c.nombre_artista
      FROM items_biblioteca ib
      JOIN canciones c ON ib.id_cancion = c.id
      WHERE ib.id_usuario = $1
      ORDER BY ib.actualizado_en DESC
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows; 
  }
};

export default bibliotecaRepository;
