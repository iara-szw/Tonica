import playlistRepository from '../repositories/playlistRepository.js';
import bibliotecaRepository from '../repositories/bibliotecaRepository.js';

export const playlistService = {
  listarPlaylistsUsuario: async (id_usuario) => {
    return await playlistRepository.obtenerTodasPorUsuario(id_usuario);
  },

  obtenerDetallePlaylist: async (id_playlist, id_usuario) => {
    const playlist = await playlistRepository.obtenerPorId(id_playlist, id_usuario);
    if (!playlist) {
      throw new Error('La playlist no existe o no pertenece al usuario.');
    }
    return playlist;
  },

  crearPlaylist: async (id_usuario, nombre, descripcion) => {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la playlist es obligatorio.');
    }
    return await playlistRepository.crear(id_usuario, nombre.trim(), descripcion);
  },

  eliminarPlaylist: async (id_playlist, id_usuario) => {
    const eliminada = await playlistRepository.eliminar(id_playlist, id_usuario);
    if (!eliminada) {
      throw new Error('No se pudo eliminar la playlist. Verifica que exista y te pertenezca.');
    }
    return { mensaje: 'Playlist eliminada exitosamente 🗑️' };
  },

  agregarCancionAPlaylist: async (id_playlist, id_usuario, musicaInput) => {
    // 1. Validar propiedad de la playlist
    const playlist = await playlistRepository.obtenerPorId(id_playlist, id_usuario);
    if (!playlist) {
      throw new Error('La playlist no existe o no tienes permisos sobre ella.');
    }

    // 2. Garantizar que la canción exista en la caché local (tabla canciones)
    const { id_externo } = musicaInput;
    const cancionesExistentes = await bibliotecaRepository.buscarMusicaPorIdExterno(id_externo);
    let cancion;

    if (!cancionesExistentes || cancionesExistentes.length === 0) {
      const nuevaCancion = await bibliotecaRepository.crearMusicaCache(musicaInput);
      cancion = nuevaCancion[0];
    } else {
      cancion = cancionesExistentes[0];
    }

    // 3. Vincular canción en la tabla intermedia de la playlist
    const resultado = await playlistRepository.agregarCancion(id_playlist, cancion.id);
    if (!resultado) {
      return { mensaje: 'La canción ya pertenecía a esta playlist 🎵' };
    }

    return { mensaje: 'Canción agregada a la playlist con éxito 🎶', cancion };
  },

  quitarCancionDePlaylist: async (id_playlist, id_cancion, id_usuario) => {
    const playlist = await playlistRepository.obtenerPorId(id_playlist, id_usuario);
    if (!playlist) {
      throw new Error('La playlist no existe o no tienes permisos sobre ella.');
    }

    const resultado = await playlistRepository.quitarCancion(id_playlist, id_cancion);
    if (!resultado) {
      throw new Error('La canción no se encontraba en esta playlist.');
    }

    return { mensaje: 'Canción removida de la playlist exitosamente ➖' };
  }
};