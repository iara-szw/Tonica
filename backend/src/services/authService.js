import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import usuarioRepository from '../repositories/usuarioRepository.js';
import actividadRepository from '../repositories/actividadRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_temporal';

const authService = {
  register: async (nombre_usuario, correo, password) => {
    const nombreNormalizado = nombre_usuario.trim();
    const correoNormalizado = correo.trim().toLowerCase();

    const usuarioExistente = await usuarioRepository.buscarEmailUsuario(correoNormalizado, nombreNormalizado);
    if (usuarioExistente) {
      throw new Error('El correo o el nombre de usuario ya están registrados.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await usuarioRepository.crearUsuario(nombreNormalizado, correoNormalizado, hashedPassword);
  },

  login: async (correo, password) => {
    const correoNormalizado = String(correo).trim().toLowerCase();
    const usuario = await usuarioRepository.buscarEmailUsuario(correoNormalizado, null);

    if (!usuario) {
      throw new Error('Credenciales inválidas.');
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      throw new Error('Credenciales inválidas.');
    }

    const token = jwt.sign(
      { id: usuario.id, nombre_usuario: usuario.nombre_usuario },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: usuario.id, nombre_usuario: usuario.nombre_usuario, correo: usuario.correo }
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
    if (datos.nombre_usuario !== undefined && String(datos.nombre_usuario).trim() === '') {
      throw new Error('El nombre de usuario no puede estar vacío.');
    }

    const perfilActualizado = await usuarioRepository.actualizarPerfil(id_usuario, {
      ...datos,
      nombre_usuario: datos.nombre_usuario ? String(datos.nombre_usuario).trim() : undefined
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
