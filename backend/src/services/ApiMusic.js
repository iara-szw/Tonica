import axios from 'axios';

const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const musicService = {
  // Ahora recibe el término y el tipo de búsqueda: 'artist', 'track' o 'album'
  searchById: async(id, type= 'track', retryCount=0) => {
 try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (devandroid@example.com)',
        'Accept': 'application/json'
      };

  let normalizedType = 'track';
    if (type === 'artist') normalizedType = 'artist';
    if (type === 'album' || type === 'release-group') normalizedType = 'album';

    let endpoint = 'recording';
    if (normalizedType === 'artist') endpoint = 'artist';
    if (normalizedType === 'album') endpoint = 'release-group';

const params = { fmt: 'json' };
    if (normalizedType === 'artist') {
      params.inc = 'release-groups+tags';
    } else if (normalizedType === 'album') {
      params.inc = 'artists+releases+tags'; // Requerido para obtener el nombre del artista del álbum
    } else if (normalizedType === 'track') {
      params.inc = 'artists+releases+tags';
    }
    
    const response = await axios.get(`${MUSICBRAINZ_URL}/${endpoint}/${id}`, {
      params:params,
        headers: headers
      });
      const obtenerGenero = (tags) => {
        if (!tags || tags.length === 0) return 'General';
        return tags[0].name;
      };
       const data = response.data;
      if (type === 'artist') {
  return {
    id_externo: data.id,
    titulo: data.name,
    nombre_artista: data.name,
    tipo: 'Artista',
    genero: data.tags && data.tags.length > 0 ? data.tags[0].name : 'General',
    id_artista_externo: data.id,
    id_album_externo: null,
    albumes: data['release-groups']
      ? data['release-groups'].map(album => ({
          id_album_externo: album.id,
          titulo: album.title,
          tipo: album['primary-type'] || 'Álbum',
          fecha: album['first-release-date'] || 'Desconocida',
          genero: album.tags && album.tags.length > 0 ? album.tags[0].name : 'General'
        }))
      : []
  };
}
      
if (normalizedType === 'album') {
        const artista = data['artist-credit']?.[0]?.name || data['artist-credit']?.[0]?.artist?.name || 'Artista Desconocido';
        const idArtista = data['artist-credit']?.[0]?.artist?.id || null;

        const canciones = [];
        const primerReleaseId = data.releases?.[0]?.id;

        if (primerReleaseId) {
          try {
            const releaseRes = await axios.get(`${MUSICBRAINZ_URL}/release/${primerReleaseId}`, {
              params: { fmt: 'json', inc: 'recordings' },
              headers: headers
            });

            if (releaseRes.data?.media) {
              releaseRes.data.media.forEach(disco => {
                if (disco.tracks) {
                  disco.tracks.forEach(track => {
                    canciones.push({
                      id_externo: track.recording?.id || track.id,
                      posicion: track.position,
                      titulo: track.title || track.recording?.title,
                      duracion_seg: track.length 
                        ? Math.round(track.length / 1000) 
                        : (track.recording?.length ? Math.round(track.recording.length / 1000) : null)
                    });
                  });
                }
              });
            }
          } catch (relErr) {
            console.error('Error obteniendo canciones del release:', relErr.message);
          }
        }

        return {
          id_externo: data.id,
          titulo: data.title,
          nombre_artista: artista,
          tipo: 'Álbum',
          genero: obtenerGenero(data.tags),
          id_artista_externo: idArtista,
          id_album_externo: data.id,
          fecha: data['first-release-date'] || 'Desconocida',
          canciones: canciones
        };
      }

const artista = data['artist-credit']?.[0]?.name || 'Artista Desconocido';
      const idArtista = data['artist-credit']?.[0]?.artist?.id || null;
      const idAlbum = data.releases?.[0]?.['release-group']?.id || null;

      return {
        id_externo: data.id,
        titulo: data.title,
        nombre_artista: artista,
        tipo: 'Canción',
        genero: data.tags && data.tags.length > 0 ? data.tags[0].name : 'General',
        id_artista_externo: idArtista,
        id_album_externo: idAlbum,
        duracion_seg: data.length ? Math.round(data.length / 1000) : null
      };
  }
   catch (error) {
      if (error.response && error.response.status === 503 && retryCount < 3) {
        await delay(1500); 
        return await musicService.searchMusic(queryTerm, type, retryCount + 1); 
      }
      
      throw new Error('El servidor de música externo está saturado o no responde.');
    }
},
  searchMusic: async (queryTerm, type = 'track', retryCount = 0) => {
    try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (devandroid@example.com)',
        'Accept': 'application/json'
      };

      // 1. Mapeamos el tipo de la app al endpoint e índice correcto de MusicBrainz
      let endpoint = 'recording'; // Por defecto busca canciones (recordings)

      if (type === 'artist') {
        endpoint = 'artist';
        searchField = 'artist';
      } else if (type === 'album') {
        endpoint = 'release-group';
        searchField = 'release_group';
      }
      console.log(`${MUSICBRAINZ_URL}/${endpoint}`)
 
      // 2. Petición por Axios al endpoint correspondiente
      const response = await axios.get(`${MUSICBRAINZ_URL}/${endpoint}`, {
        params: {
          query: searchTerm,
          limit: 20,
          fmt: 'json'
        },
        headers: headers
      });

      const data = response.data;

      // 3. Mapeo dinámico según lo que haya devuelto la API externa
      if (type === 'artist') {
        if (!data.artists) return [];
        return data.artists.map(artist => ({
          id_externo: artist.id,
          titulo: artist.name,
          nombre_artista: artist.name,
          tipo: 'Artista',
          genero: artist.tags && artist.tags.length > 0 ? artist.tags[0].name : 'General',
          id_artista_externo: artist.id,
          id_album_externo: null,
          duracion_seg: null
        }));
      } 
      
      if (type === 'album') {
        if (!data['release-groups']) return [];
        return data['release-groups'].map(album => ({
          id_externo: album.id,
          titulo: album.title,
          nombre_artista: album['artist-credit']?.[0]?.artist?.name || 'Artista Desconocido',
          tipo: 'Álbum',
          genero: album.tags && album.tags.length > 0 ? album.tags[0].name : 'General',
          id_artista_externo: album['artist-credit']?.[0]?.artist?.id || null,
          id_album_externo: album.id,
          duracion_seg: null
        }));
      }

      // Por defecto: 'track' (Canciones)
      if (!data.recordings) return [];
      return data.recordings.map(track => {
        // Calculamos la duración de milisegundos a segundos si viene el dato
        const duracionSeg = track.length ? Math.round(track.length / 1000) : null;
        
        return {
          id_externo: track.id,
          titulo: track.title,
          nombre_artista: track['artist-credit']?.[0]?.name || 'Artista Desconocido',
          tipo: 'Canción',
          genero: track.tags && track.tags.length > 0 ? track.tags[0].name : 'General',
          id_artista_externo: track['artist-credit']?.[0]?.artist?.id || null,
          id_album_externo: track.releases?.[0]?.['release-group']?.id || null,
          duracion_seg: duracionSeg
        };
      });

    } catch (error) {
      if (error.response && error.response.status === 503 && retryCount < 3) {
        await delay(1500); 
        return await musicService.searchMusic(queryTerm, type, retryCount + 1); 
      }
      
      throw new Error('El servidor de música externo está saturado o no responde.');
    }
  }
};
