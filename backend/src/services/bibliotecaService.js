import bibliotecaRepository from '../repositories/bibliotecaRepository.js';

export const bibliotecaService = {
  guardarInteraccionMusica: async (id_usuario, musicaInput, interaccionInput) => {
    const { id_externo } = musicaInput;
    const { estado = 'quiero_escuchar', es_favorito = false, puntuacion = null } = interaccionInput;

    let musica = await bibliotecaRepository.buscarMusicaPorIdExterno(id_externo);

    if (!musica) {
      musica = await bibliotecaRepository.crearMusicaCache({
        fuente: 'musicbrainz',
        ...musicaInput
      });
    }

    const itemBiblioteca = await bibliotecaRepository.guardarItemBiblioteca(
      id_usuario,
      musica.id, 
      estado,
      es_favorito,
      puntuacion
    );

    return {
      mensaje: "Biblioteca actualizada con éxito 🎵",
      item: {
        ...itemBiblioteca,
        titulo: musica.titulo,
        nombre_artista: musica.nombre_artista
      }
    };
  }
};
