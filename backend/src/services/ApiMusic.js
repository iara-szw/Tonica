import axios from 'axios';

const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const musicService = {
  // Ahora recibe el término y el tipo de búsqueda: 'artist', 'track' o 'album'
  searchMusic: async (queryTerm, type = 'track', retryCount = 0) => {
    try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (devandroid@example.com)',
        'Accept': 'application/json'
      };

      // 1. Mapeamos el tipo de la app al endpoint e índice correcto de MusicBrainz
      let endpoint = 'recording'; // Por defecto busca canciones (recordings)
      let searchField = 'recording';

      if (type === 'artist') {
        endpoint = 'artist';
        searchField = 'artist';
      } else if (type === 'album') {
        endpoint = 'release-group';
        searchField = 'release_group';
      }

      const searchTerm = `${searchField}:${queryTerm.trim()}`;

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
