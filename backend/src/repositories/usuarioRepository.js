import pool from '../config/db.js';

const userRepository = {
  buscarEmailUsuario: async (correo, nombre_usuario) => {
    const query = 'SELECT * FROM usuarios WHERE correo = $1 OR nombre_usuario = $2';
    const result = await pool.query(query, [correo, nombre_usuario]);
    return result.rows;
  },


  crearUsuario: async (nombre_usuario, correo, password_hash) => {
    const query = `
      INSERT INTO usuarios (nombre_usuario, correo, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, nombre_usuario, correo, creado_en
    `;
    const result = await pool.query(query, [nombre_usuario, correo, password_hash]);
    return result.rows[0];
  },
// Obtener datos completos del perfil por ID de usuario
  obtenerPerfilPorId: async (id_usuario) => {
    const query = `
      SELECT id, nombre_usuario, correo, avatar_url, bio, preferencias, creado_en
      FROM usuarios
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id_usuario]);
    return result.rows[0];
  },

  actualizarPerfil: async (id_usuario, { nombre_usuario, avatar_url, bio, preferencias }) => {
    const query = `
      UPDATE usuarios
      SET
        nombre_usuario = COALESCE($1, nombre_usuario),
        avatar_url = COALESCE($2, avatar_url),
        bio = COALESCE($3, bio),
        preferencias = COALESCE($4::jsonb, preferencias)
      WHERE id = $5
      RETURNING id, nombre_usuario, correo, avatar_url, bio, preferencias, creado_en;
    `;
    const result = await pool.query(query, [
      nombre_usuario || null,
      avatar_url ?? null,
      bio ?? null,
      preferencias !== undefined ? JSON.stringify(preferencias) : null,
      id_usuario
    ]);
    return result.rows[0];
  }
};

export default userRepository;