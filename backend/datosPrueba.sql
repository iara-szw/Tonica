-- Limpiar tablas y reiniciar IDs para carga reproducible
TRUNCATE TABLE
  actividad_usuario,
  playlist_items,
  playlists,
  items_biblioteca,
  canciones,
  usuarios
RESTART IDENTITY CASCADE;

-- 1. Usuario de demostración (correo: demo@tonica.com | clave: demo1234)
INSERT INTO usuarios (nombre_usuario, correo, password_hash, avatar_url, bio, preferencias)
VALUES (
  'demo_tonica',
  'demo@tonica.com',
  '$2b$10$/8PY6.P6bGdH7pOyT3oYNOtDbHA.Uv2D3GHYk3slZlMwaGR3HTwHG', --Hash de la contraseña
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
  'Explorando discos completos, rock alternativo y electrónica. I Heart heart',
  '{"generos_favoritos": ["album rock", "classic rock", "folk rock"], "tema": "oscuro"}'::jsonb
);

-INSERT INTO canciones (
  id_externo, fuente, tipo, titulo, id_artista_externo, id_album_externo, nombre_artista, genero, duracion_seg, portada_url
) VALUES
  (
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'musicbrainz',
    'Álbum',
    'Dreamboat Annie',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    2396,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-500'
  ),
  (
    'f3522cc5-7a41-4d3c-8d26-f386e3ed7282',
    'musicbrainz',
    'Canción',
    'Magic Man',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    328,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    'd92bcd93-9da6-44e7-997c-fb41522f8ec9',
    'musicbrainz',
    'Canción',
    'Dreamboat Annie (Fantasy Child)',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    70,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '6bbd8560-58e8-4ae0-a04f-5a675e477bd2',
    'musicbrainz',
    'Canción',
    'Crazy on You',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    293,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '4d75e945-6d1e-429a-b63e-271d9328a5b5',
    'musicbrainz',
    'Canción',
    'Soul of the Sea',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    393,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '46c68986-5c72-4f23-9a20-d959bd2699df',
    'musicbrainz',
    'Canción',
    'Dreamboat Annie',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    122,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '2b5a9f04-e06a-4d10-8c46-efc2eaeeca9a',
    'musicbrainz',
    'Canción',
    'White Lightning & Wine',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    234,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    'd899116c-396c-4387-8b6c-b5eeb8ccfb6c',
    'musicbrainz',
    'Canción',
    '(Love Me Like Music) I’ll Be Your Song',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    201,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    'ae480ea7-f2c8-424d-8987-aeeb0d13fc67',
    'musicbrainz',
    'Canción',
    'Sing Child',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    295,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '00bdc8bd-3262-4d40-8b02-24b311532963',
    'musicbrainz',
    'Canción',
    'How Deep It Goes',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    230,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  ),
  (
    '2d949f18-abc3-476c-aff8-7a683ebd4d8d',
    'musicbrainz',
    'Canción',
    'Dreamboat Annie (reprise)',
    'bdbd48f5-abf3-4a4f-9a21-4551dbc3fde9',
    '65ebadae-3fcc-32c2-a161-a2cd53854c9b',
    'Heart',
    'album rock',
    230,
    'https://coverartarchive.org/release-group/65ebadae-3fcc-32c2-a161-a2cd53854c9b/front-250'
  );

-- 3. Biblioteca del usuario (álbum + 10 canciones con estados, favoritos, puntuaciones y reseñas)
INSERT INTO items_biblioteca (id_usuario, id_cancion, estado, es_favorito, puntuacion, resena) VALUES
  (1, 1, 'escuchado', true, 5, 'Álbum debut histórico de Ann y Nancy Wilson. Mezcla impecable de hard rock y folk acústico.'),
  (1, 2, 'escuchado', true, 5, 'El solo de guitarra y la potencia vocal de Ann Wilson en Magic Man son insuperables.'),
  (1, 4, 'escuchado', true, 5, 'La intro acústica de Nancy Wilson seguida de la explosión eléctrica es un clásico absoluto.'),
  (1, 6, 'escuchado', true, 5, NULL),
  (1, 5, 'escuchado', false, 4, NULL),
  (1, 3, 'escuchado', false, NULL, NULL),
  (1, 7, 'escuchando', true, 4, NULL),
  (1, 8, 'escuchando', false, NULL, NULL),
  (1, 9, 'quiero_escuchar', false, NULL, NULL),
  (1, 10, 'quiero_escuchar', false, NULL, NULL),
  (1, 11, 'quiero_escuchar', false, NULL, NULL);

-- 4. Playlists del usuario
INSERT INTO playlists (id_usuario, nombre, descripcion) VALUES
  (1, 'Clásicos de Heart (1975)', 'Los temas más potentes del álbum Dreamboat Annie.'),
  (1, 'Acústico y Folk Rock - Wilson Sisters', 'Pasajes acústicos y melodías suaves de Heart.'),
  (1, 'Álbumes Completos', 'Discos de estudio guardados para escuchar de principio a fin.');

-- 5. Ítems dentro de las playlists
INSERT INTO playlist_items (id_playlist, id_cancion) VALUES
  (1, 2),
  (1, 4),
  (1, 7),
  (1, 9),
  (2, 3),
  (2, 6),
  (2, 8),
  (2, 10),
  (2, 11),
  (3, 1);

-- 6. Historial de actividad reciente
INSERT INTO actividad_usuario (id_usuario, tipo_accion, descripcion) VALUES
  (1, 'BIBLIOTECA_ACTUALIZADA', 'Guardó "Dreamboat Annie" (Álbum - escuchado) ★ Favorito - Puntuación: 5/5'),
  (1, 'RESENA_PUBLICADA', 'Publicó una reseña en "Dreamboat Annie"'),
  (1, 'BIBLIOTECA_ACTUALIZADA', 'Guardó "Magic Man" (Canción - escuchado) ★ Favorito - Puntuación: 5/5'),
  (1, 'BIBLIOTECA_ACTUALIZADA', 'Guardó "Crazy on You" (Canción - escuchado) ★ Favorito - Puntuación: 5/5'),
  (1, 'PLAYLIST_CREADA', 'Creó la playlist "Clásicos de Heart (1975)"'),
  (1, 'PLAYLIST_CREADA', 'Creó la playlist "Acústico y Folk Rock - Wilson Sisters"');