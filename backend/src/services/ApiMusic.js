import axios from 'axios';

const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const musicService = {
  searchArtists: async (artistName, retryCount = 0) => {
    try {
      const headers = {
        'User-Agent': 'TonicaApp/1.0.0 (devandroid@example.com)',
        'Accept': 'application/json'
      };

      const searchTerm = `artist:${artistName.trim()}`;

      const response = await axios.get(`${MUSICBRAINZ_URL}/artist/`, {
        params: {
          query: searchTerm,
          limit: 25,
          fmt: 'json'
        },
        headers: headers
      });

      const data = response.data;
      if (!data.artists) return [];

      return data.artists.map(artist => {
        const tieneTags = artist.tags && artist.tags.length > 0;
        const generoDeducido = tieneTags ? artist.tags[0].name : 'General';

        return {
          id_externo: artist.id, 
          nombre: artist.name,
          tipo: artist.type || 'Desconocido',
          pais: artist.country || 'N/A',
          genero_principal: generoDeducido
        };
      });

    } catch (error) {
      // Mecanismo anti rate limit en caso de error 503
      if (error.response && error.response.status === 503 && retryCount < 3) {
        await delay(1500); 
        return await musicService.searchArtists(artistName, retryCount + 1); 
      }
      throw new Error('El servidor de música externo está saturado o no responde. Por favor, intentá de nuevo.');
    }
  }
};
