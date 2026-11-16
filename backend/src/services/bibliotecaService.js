import bibliotecaRepository from '../repositories/bibliotecaRepository.js';
import actividadRepository from '../repositories/actividadRepository.js';
import { musicService } from './ApiMusic.js';
import pool from '../config/db.js';

const normalizarTipo = (tipo) => {
  if (!tipo) return 'track';
  const t = String(tipo).toLowerCase().trim();
  if (t === 'artist' || t === 'artista') return 'artist';
  if (t === 'album' || t === 'álbum' || t === 'release-group') return 'album';
  return 'track';
};

export const bibliotecaService = {
  // Busca en caché local por id_externo; si no existe, consulta MusicBrainz y guarda en caché
  obtenerOCachearMusica: async (id_externo, tipo = 'track') => {
    if (!id_externo || String(id_externo).trim() === '') {
      throw new Error('El id_externo es obligatorio.');
    }

    const cleanId = String(id_externo).trim();

    // 1. Verificar caché local primero
    const existentes = await bibliotecaRepository.buscarMusicaPorIdExterno(cleanId);
    if (existentes && existentes.length > 0) {
      return existentes[0];
    }

    // 2. Consultar datos completos en MusicBrainz usando solo el ID y el tipo
    const tipoNormalizado = normalizarTipo(tipo);
    const datosExternos = await musicService.searchById(cleanId, tipoNormalizado);

    const etiquetaTipo =
      datosExternos.tipo ||
      (tipoNormalizado === 'artist' ? 'Artista' : tipoNormalizado === 'album' ? 'Álbum' : 'Canción');

    // 3. Guardar en caché local
    const insertados = await bibliotecaRepository.crearMusicaCache({
      id_externo: datosExternos.id_externo || cleanId,
      fuente: 'musicbrainz',
      tipo: etiquetaTipo,
      titulo: datosExternos.titulo,
      id_artista_externo: datosExternos.id_artista_externo || null,
      id_album_externo: datosExternos.id_album_externo || null,
      nombre_artista: datosExternos.nombre_artista,
      genero: datosExternos.genero || 'General',
      duracion_seg: datosExternos.duracion_seg || null,
      portada_url: datosExternos.portada_url || null
    });

    if (insertados && insertados.length > 0) {
      return insertados[0];
    }

    // Fallback si dos peticiones concurrentes insertaron el mismo ID al mismo tiempo
    const reintento = await bibliotecaRepository.buscarMusicaPorIdExterno(cleanId);
    if (!reintento || reintento.length === 0) {
      throw new Error('No se pudo guardar el contenido en la caché local.');
    }
    return reintento[0];
  },

  guardarInteraccionMusica: async (id_usuario, { id_externo, tipo = 'track' }, interaccionInput = {}) => {
    const {
      estado = 'quiero_escuchar',
      es_favorito = false,
      puntuacion = null,
      resena = null
    } = interaccionInput;

    // 1. Obtener desde caché o traer automáticamente desde MusicBrainz
    const contenido = await bibliotecaService.obtenerOCachearMusica(id_externo, tipo);

    if (estado === 'escuchando') {
      await pool.query(
        `
          UPDATE items_biblioteca
          SET estado = 'escuchado', actualizado_en = now()
          WHERE id_usuario = $1
            AND estado = 'escuchando'
            AND id_cancion <> $2
        `,
        [id_usuario, contenido.id]
      );
    }

    // 2. Guardar o actualizar relación en items_biblioteca
    const resultadoItem = await bibliotecaRepository.guardarItemBiblioteca(
      id_usuario,
      contenido.id,
      estado,
      es_favorito,
      puntuacion,
      resena
    );

    const itemBiblioteca = resultadoItem[0];

    // 3. Registrar actividad
    await actividadRepository.registrar(
      id_usuario,
      'BIBLIOTECA_ACTUALIZADA',
      `Guardó "${contenido.titulo}" (${contenido.tipo} - ${estado})${es_favorito ? ' ★ Favorito' : ''}${puntuacion ? ` - Puntuación: ${puntuacion}/5` : ''}`
    );

    return {
      mensaje: 'Biblioteca actualizada con éxito 🎵',
      item: {
        ...itemBiblioteca,
        id_externo: contenido.id_externo,
        tipo: contenido.tipo,
        titulo: contenido.titulo,
        nombre_artista: contenido.nombre_artista,
        genero: contenido.genero,
        duracion_seg: contenido.duracion_seg,
        portada_url: contenido.portada_url
      }
    };
  },

  verBiblioteca: async (id_usuario) => {
    return await bibliotecaRepository.obtenerItemsBiblioteca(id_usuario);
  },

  guardarResena: async (id_usuario, id_cancion, resena) => {
    if (!resena || resena.trim() === '') {
      throw new Error('El texto de la reseña no puede estar vacío.');
    }

    const item = await bibliotecaRepository.guardarResena(id_usuario, id_cancion, resena.trim());
    if (!item) {
      throw new Error('Primero debes agregar este elemento a tu biblioteca para poder reseñarlo.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'RESENA_PUBLICADA',
      `Publicó o editó una reseña en el ítem #${id_cancion}`
    );

    return item;
  },

  borrarResena: async (id_usuario, id_cancion) => {
    const item = await bibliotecaRepository.eliminarResena(id_usuario, id_cancion);
    if (!item) {
      throw new Error('No se encontró el ítem en tu biblioteca.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'RESENA_ELIMINADA',
      `Eliminó su reseña del ítem #${id_cancion}`
    );

    return { mensaje: 'Reseña eliminada con éxito 🗑️', item };
  },

  eliminarDeBiblioteca: async (id_usuario, id_cancion) => {
    const eliminado = await bibliotecaRepository.eliminarItemBiblioteca(id_usuario, id_cancion);
    if (!eliminado) {
      throw new Error('El ítem no existe en tu biblioteca.');
    }

    await actividadRepository.registrar(
      id_usuario,
      'BIBLIOTECA_ELIMINADA',
      `Quitó el ítem #${id_cancion} de su biblioteca`
    );

    return { mensaje: 'Elemento eliminado de tu biblioteca 🗑️' };
  }
};