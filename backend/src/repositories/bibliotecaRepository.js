import pool from '../config/db.js';

const bibliotecaRepository = {
  // 1. Busca en la tabla 'musica' usando el MBID (id_externo)
  buscarMusicaPorIdExterno: async (id_externo) => {
    const query = 'SELECT * FROM musica WHERE id_externo = $1';
    const result = await pool.query(query, [id_externo]);
    return result.rows[0]; // Retorna la primera fila encontrada
  },

  // 2. Guarda el registro en la tabla 'musica' (caché local)
  crearMusicaCache: async (musicaData) => {
    const { fuente, id_externo, titulo, id_artista_externo, id_album_externo, nombre_artista, genero, duracion_seg } = musicaData;
    const query = `
      INSERT INTO musica (fuente, id_externo, titulo, id_artista_externo, id_album_externo, nombre_artista, genero, duracion_seg)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [
      fuente || 'musicbrainz', 
      id_externo, 
      titulo, 
      id_artista_externo || null, 
      id_album_externo || null, 
      nombre_artista || null, 
      genero || 'General', 
      duracion_seg || null
    ]);
    return result.rows[0];
  },

  // 3. Guarda o actualiza en la tabla 'items_biblioteca' usando ON CONFLICT
  guardarItemBiblioteca: async (id_usuario, id_musica, estado, es_favorito, puntuacion) => {
    const query = `
      INSERT INTO items_biblioteca (id_usuario, id_musica, estado, es_favorito, puntuacion, actualizado_en)
      VALUES ($1, $2, $3, $4, $5, now())
      ON CONFLICT (id_usuario, id_musica) 
      DO UPDATE SET 
        estado = EXCLUDED.estado,
        es_favorito = EXCLUDED.es_favorito,
        puntuacion = COALESCE(EXCLUDED.puntuacion, items_biblioteca.puntuacion),
        actualizado_en = now()
      RETURNING *
    `;
    const result = await pool.query(query, [id_usuario, id_musica, estado, es_favorito, puntuacion]);
    return result.rows[0];
  }
};

export default bibliotecaRepository;
