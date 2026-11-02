import pool from '../config/db.js';

const userRepository = {
  findByEmailOrUsername: async (correo, nombre_usuario) => {
    const query = 'SELECT * FROM usuarios WHERE correo = $1 OR nombre_usuario = $2';
    const result = await pool.query(query, [correo, nombre_usuario]);
    return result.rows;
  },

  findByEmail: async (correo) => {
    const query = 'SELECT * FROM usuarios WHERE correo = $1';
    const result = await pool.query(query, [correo]);
    return result.rows[0]; 
  },

  createUser: async (nombre_usuario, correo, password_hash) => {
    const query = `
      INSERT INTO usuarios (nombre_usuario, correo, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, nombre_usuario, correo, creado_en
    `;
    const result = await pool.query(query, [nombre_usuario, correo, password_hash]);
    return result.rows[0];
  }
};

export default userRepository;
