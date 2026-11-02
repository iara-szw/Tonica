import bibliotecaRepository from '../repositories/bibliotecaRepository.js';

export const bibliotecaService = {
  guardarInteraccionMusica: async (id_usuario, musicaInput, interaccionInput) => {
    const { id_externo } = musicaInput;
    const { estado = 'quiero_escuchar', es_favorito = false, puntuacion = null } = interaccionInput;

    // 1. Buscamos si la canción ya existe en la caché local
    const cancionesExistentes = await bibliotecaRepository.buscarMusicaPorIdExterno(id_externo);
    let cancion;

    // 2. Si el array está vacío (length === 0), la creamos. Si no, la reutilizamos.
    if (!cancionesExistentes || cancionesExistentes.length === 0) {
      const nuevaCancionCache = await bibliotecaRepository.crearMusicaCache(musicaInput);
      cancion = nuevaCancionCache[0];
    } else {
      cancion = cancionesExistentes[0];
    }

    if (!cancion || !cancion.id) {
      throw new Error('No se pudo procesar la canción en la base de datos.');
    }

    // 3. Guardamos o actualizamos la relación en items_biblioteca
    const resultadoItem = await bibliotecaRepository.guardarItemBiblioteca(
      id_usuario,
      cancion.id,
      estado,
      es_favorito,
      puntuacion
    );
    
    const itemBiblioteca = resultadoItem[0];

    return {
      mensaje: "Biblioteca actualizada con éxito 🎵",
      item: {
        id: itemBiblioteca.id,
        id_usuario: itemBiblioteca.id_usuario,
        id_cancion: itemBiblioteca.id_cancion,
        estado: itemBiblioteca.estado,
        es_favorito: itemBiblioteca.es_favorito,
        puntuacion: itemBiblioteca.puntuacion,
        titulo: cancion.titulo,
        nombre_artista: cancion.nombre_artista
      }
    };
  }
};
