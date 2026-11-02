import axios from 'axios';

const MUSICBRAINZ_URL = 'https://musicbrainz.org';

export const musicService = {
  searchArtists: async (artistName) => {
    try {
      const response = await axios.get(`${MUSICBRAINZ_URL}/artist`, {
        params: {
          query: artistName,
          limit: 25,
          fmt: 'json'
        },
        headers: {
          'User-Agent': 'TonicaApp/1.0.0 (tonicaDEVluma@example.com)',
          'Accept': 'application/json'
        }
      });

      const data = response.data;

      return data.artists.map(artist => ({
        id_externo: artist.id,
        nombre: artist.name,
        tipo: artist.type || 'Desconocido',
        pais: artist.country || 'N/A',
        genero_principal: artist.tags && artist.tags.length > 0 ? artist.tags[0].name : 'General'
      }));

    } catch (error) {
      if (error.response) {
        console.error(`Error de MusicBrainz (${error.response.status}):`, error.response.data);
      } else {
        console.error('Error de conexión en musicService:', error.message);
      }
      throw new Error('No se pudo completar la búsqueda en el servicio de música externo.');
    }
  }
};
