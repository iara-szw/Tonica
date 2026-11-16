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

    const nuevaPlaylist = await playlistRepository.crear(id_usuario, nombre.trim(), descripcion);

    await actividadRepository.registrar(
      id_usuario,
      'PLAYLIST_CREADA',
      `Creó la playlist "${nuevaPlaylist.nombre}"`
    );

    return nuevaPlaylist;
  },

 eliminarPlaylist: async (id_playlist, id_usuario) => {
    const eliminada = await playlistRepository.eliminar(id_playlist, id_usuario);
    if (!eliminada) {
      throw new Error('No se pudo eliminar la playlist. Verifica que exista y te pertenezca.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'PLAYLIST_ELIMINADA',
      `Eliminó la playlist #${id_playlist}`
    );

    return { mensaje: 'Playlist eliminada exitosamente 🗑️' };
  },
agregarCancionAPlaylist: async (id_playlist, id_usuario, { id_externo, tipo = 'track' }) => {
    // 1. Validar propiedad de la playlist
    const playlist = await playlistRepository.obtenerPorId(id_playlist, id_usuario);
    if (!playlist) {
      throw new Error('La playlist no existe o no tienes permisos sobre ella.');
    }

    // 2. Obtener de caché o buscar automáticamente en MusicBrainz por ID
    const contenido = await bibliotecaService.obtenerOCachearMusica(id_externo, tipo);

    // 3. Vincular en la tabla intermedia de la playlist
    const resultado = await playlistRepository.agregarCancion(id_playlist, contenido.id);
    if (!resultado) {
      return { mensaje: 'Este elemento ya pertenecía a la playlist 🎵' };
    }

    await actividadRepository.registrar(
      id_usuario,
      'PLAYLIST_ITEM_AGREGADO',
      `Agregó "${contenido.titulo}" a la playlist "${playlist.nombre}"`
    );

    return { mensaje: 'Agregado a la playlist con éxito 🎶', contenido };
  },
  quitarCancionDePlaylist: async (id_playlist, id_cancion, id_usuario) => {
    const playlist = await playlistRepository.obtenerPorId(id_playlist, id_usuario);
    if (!playlist) {
      throw new Error('La playlist no existe o no tienes permisos sobre ella.');
    }

    const resultado = await playlistRepository.quitarCancion(id_playlist, id_cancion);
    if (!resultado) {
      throw new Error('El elemento no se encontraba en esta playlist.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'PLAYLIST_ITEM_ELIMINADO',
      `Quitó el ítem #${id_cancion} de la playlist "${playlist.nombre}"`
    );

    return { mensaje: 'Removido de la playlist exitosamente ➖' };
  }
};