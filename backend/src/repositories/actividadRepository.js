import pool from '../config/db.js';

const actividadRepository = {
  // Registrar un evento de actividad en la base de datos
  registrar: async (id_usuario, tipo_accion, descripcion) => {
    const query = `
      INSERT INTO actividad_usuario (id_usuario, tipo_accion, descripcion, creado_en)
      VALUES ($1, $2, $3, now())
      RETURNING *;
    `;
    const result = await pool.query(query, [id_usuario, tipo_accion, descripcion]);
    return result.rows[0];
  },

  // Obtener la actividad reciente de un usuario (para Home y Perfil)
  obtenerRecientePorUsuario: async (id_usuario, limite = 20) => {
    const query = `
      SELECT id, tipo_accion, descripcion, creado_en
      FROM actividad_usuario
      WHERE id_usuario = $1
      ORDER BY creado_en DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [id_usuario, limite]);
    return result.rows;
  }
};

export default actividadRepository;