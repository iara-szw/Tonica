import express from 'express';
import authJWT from '../middleware/authJWT.js';
import { bibliotecaService } from '../services/bibliotecaService.js';

const router = express.Router();

router.post('/', authJWT, async (req, res) => {
  const { musica, interact } = req.body;
  const id_usuario = req.user.id; 

  if (!musica || !musica.id_externo || !musica.fuente) {
    return res.status(400).json({ error: 'Faltan datos obligatorios: id_externo y fuente.' });
  }

  try {
    const resultado = await bibliotecaService.guardarInteraccionMusica(
      id_usuario,
      {
        id_externo: musica.id_externo,
        fuente: musica.fuente,
        titulo: musica.titulo,
        nombre_artista: musica.nombre_artista,
        genero: musica.genero,
        duracion_seg: musica.duracion_seg,
        id_artista_externo: musica.id_artista_externo,
        id_album_externo: musica.id_album_externo
      },
      interact || {}
    );

    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.get('/', authJWT, async (req, res) => {
  const id_usuario = req.user.id; // Obtener el ID del usuario autenticado

  try {
    const resultado = await bibliotecaService.verBiblioteca(id_usuario);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
