import axios from 'axios';

const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_URL = 'https://coverartarchive.org/release-group';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const musicService = {
  searchById: async (id, type = 'track', retryCount = 0) => {
    try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (contacto@tonicaapp.com)',
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
        params.inc = 'artists+releases+tags';
      } else if (normalizedType === 'track') {
        params.inc = 'artists+releases+tags';
      }

      const response = await axios.get(`${MUSICBRAINZ_URL}/${endpoint}/${id}`, { params, headers });
      const data = response.data;
      
      const obtenerGenero = (tags) => (tags && tags.length > 0 ? tags[0].name : 'General');

      if (type === 'artist') {
        return {
          id_externo: data.id,
          titulo: data.name,
          nombre_artista: data.name,
          tipo: 'Artista',
          genero: obtenerGenero(data.tags),
          id_artista_externo: data.id,
          id_album_externo: null,
          albumes: data['release-groups'] ? data['release-groups'].map(album => ({
            id_album_externo: album.id,
            titulo: album.title,
            tipo: album['primary-type'] || 'Álbum',
            fecha: album['first-release-date'] || 'Desconocida',
            genero: obtenerGenero(album.tags),
            portada_url: album.id ? `${COVER_ART_URL}/${album.id}/front-250` : null
          })) : []
        };
      }
      
      if (normalizedType === 'album') {
        const artista = data['artist-credit']?.[0]?.name || data['artist-credit']?.[0]?.artist?.name || 'Artista Desconocido';
        const canciones = [];
        const primerReleaseId = data.releases?.[0]?.id;

        if (primerReleaseId) {
          try {
            const releaseRes = await axios.get(`${MUSICBRAINZ_URL}/release/${primerReleaseId}`, {
              params: { fmt: 'json', inc: 'recordings' }, headers
            });
            if (releaseRes.data?.media) {
              releaseRes.data.media.forEach(disco => {
                if (disco.tracks) {
                  disco.tracks.forEach(track => {
                    canciones.push({
                      id_externo: track.recording?.id || track.id,
                      posicion: track.position,
                      titulo: track.title || track.recording?.title,
                      duracion_seg: track.length ? Math.round(track.length / 1000) : null
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
          id_artista_externo: data['artist-credit']?.[0]?.artist?.id || null,
          id_album_externo: data.id,
          portada_url: `${COVER_ART_URL}/${data.id}/front-500`,
          fecha: data['first-release-date'] || 'Desconocida',
          canciones: canciones
        };
      }

      const idAlbum = data.releases?.[0]?.['release-group']?.id || null;
      return {
        id_externo: data.id,
        titulo: data.title,
        nombre_artista: data['artist-credit']?.[0]?.name || 'Artista Desconocido',
        tipo: 'Canción',
        genero: obtenerGenero(data.tags),
        id_artista_externo: data['artist-credit']?.[0]?.artist?.id || null,
        id_album_externo: idAlbum,
        portada_url: idAlbum ? `${COVER_ART_URL}/${idAlbum}/front-250` : null,
        duracion_seg: data.length ? Math.round(data.length / 1000) : null
      };

    } catch (error) {
      if (error.response && (error.response.status === 503 || error.response.status === 429) && retryCount < 3) {
        await delay(1500 * (retryCount + 1)); 
        return await musicService.searchById(id, type, retryCount + 1); 
      }
      throw new Error('El servidor de música externo está saturado o no responde.');
    }
  },

  searchMusic: async (queryTerm, type = 'track', retryCount = 0) => {
    if (!queryTerm || !queryTerm.trim()) return [];
    
    try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (contacto@tonicaapp.com)',
        'Accept': 'application/json'
      };

      let endpoint = 'recording';
      if (type === 'artist') endpoint = 'artist';
      else if (type === 'album') endpoint = 'release-group';

      const response = await axios.get(`${MUSICBRAINZ_URL}/${endpoint}`, {
        params: { query: queryTerm, limit: 20, fmt: 'json' },
        headers: headers
      });

      const data = response.data;
      const obtenerGenero = (tags) => (tags && tags.length > 0 ? tags[0].name : 'General');

      if (type === 'artist') {
        if (!data.artists) return [];
        return data.artists.map(artist => ({
          id_externo: artist.id,
          titulo: artist.name,
          nombre_artista: artist.name,
          tipo: 'Artista',
          genero: obtenerGenero(artist.tags),
          id_artista_externo: artist.id,
          id_album_externo: null,
          portada_url: null,
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
          genero: obtenerGenero(album.tags),
          id_artista_externo: album['artist-credit']?.[0]?.artist?.id || null,
          id_album_externo: album.id,
          portada_url: album.id ? `${COVER_ART_URL}/${album.id}/front-250` : null,
          duracion_seg: null
        }));
      }

      if (!data.recordings) return [];
      return data.recordings.map(track => {
        const idAlbum = track.releases?.[0]?.['release-group']?.id || null;
        return {
          id_externo: track.id,
          titulo: track.title,
          nombre_artista: track['artist-credit']?.[0]?.name || 'Artista Desconocido',
          tipo: 'Canción',
          genero: obtenerGenero(track.tags),
          id_artista_externo: track['artist-credit']?.[0]?.artist?.id || null,
          id_album_externo: idAlbum,
          portada_url: idAlbum ? `${COVER_ART_URL}/${idAlbum}/front-250` : null,
          duracion_seg: track.length ? Math.round(track.length / 1000) : null
        };
      });

    } catch (error) {
      if (error.response && (error.response.status === 503 || error.response.status === 429) && retryCount < 3) {
        await delay(1500 * (retryCount + 1)); 
        return await musicService.searchMusic(queryTerm, type, retryCount + 1); 
      }
      throw new Error('El servidor de música externo está saturado o no responde.');
    }
  }
};