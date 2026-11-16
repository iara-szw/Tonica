import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import usuarioRepository from '../repositories/usuarioRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_temporal';

const authService = {
  register: async (nombre_usuario, correo, password) => {
    const usu = await usuarioRepository.buscarEmailUsuario(correo, nombre_usuario);
    if (usu.length > 0) {
      throw new Error('El correo o el nombre de usuario ya están registrados.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await usuarioRepository.crearUsuario(nombre_usuario, correo, hashedPassword);
  },

  login: async (correo, password) => {
    const usu = await usuarioRepository.buscarEmailUsuario(correo, null);
    if (!usu) {
      throw new Error('Credenciales inválidas.');
    }

    const coincide = await bcrypt.compare(password, usu.password_hash);
    if (!coincide) {
      throw new Error('Credenciales inválidas.');
    }

    const token = jwt.sign(
      { id: usu.id, nombre_usuario: usu.nombre_usuario },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: usu.id, nombre_usuario: usu.nombre_usuario, correo: usu.correo }
    };
  },
  obtenerPerfil: async (id_usuario) => {
    const perfil = await usuarioRepository.obtenerPerfilPorId(id_usuario);
    if (!perfil) {
      throw new Error('Usuario no encontrado.');
    }
    return perfil;
  },

  actualizarPerfil: async (id_usuario, datos) => {
    if (datos.nombre_usuario !== undefined && datos.nombre_usuario.trim() === '') {
      throw new Error('El nombre de usuario no puede estar vacío.');
    }

    const perfilActualizado = await usuarioRepository.actualizarPerfil(id_usuario, {
      ...datos,
      nombre_usuario: datos.nombre_usuario ? datos.nombre_usuario.trim() : undefined
    });

    if (!perfilActualizado) {
      throw new Error('No se pudo actualizar el perfil.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'PERFIL_ACTUALIZADO',
      'Actualizó su información de perfil'
    );

    return perfilActualizado;
  }
};

export default authService;
