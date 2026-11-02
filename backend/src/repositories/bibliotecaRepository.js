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
    const { id_externo, titulo, id_artista_externo, id_album_externo, nombre_artista, genero, duracion_seg } = musicaData;
    const query = `
      INSERT INTO canciones (id_externo, titulo, id_artista_externo, id_album_externo, nombre_artista, genero, duracion_seg)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      id_externo, 
      titulo, 
      id_artista_externo || null, 
      id_album_externo || null, 
      nombre_artista || null, 
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
};

export default bibliotecaRepository;
