# 🎵 Tónica

Se trata de una plataforma que te permite guardar y valorar la música que escuchás y escribir reseñas sobre ello. A la vez, podés también descubrir música nueva y leer tus estadísticas sobre tus minutos escuchados y artistas y géneros musicales más escuchados.

---
## 👥 Integrantes y Responsabilidades

| Integrante | GitHub | Responsabilidades en el proyecto |
| :--- | :--- | :--- |
| Iara | @[iara_szw](https://github.com/iara-szw) | [Principalmente backend y bd] |
| Juana | @[juaaloop](https://github.com/juaaloop) | [Principalmente diseño y frontend] |

---

## 🔗 Links 

* **Frontend:** [Tonica](https://tonica-1-cert.onrender.com)
* **Backend:** [Backend](https://tonica-9hyg.onrender.com)
* **Diseño en Figma:** [Figma](https://www.figma.com/design/KJXIFh9da60lOK50qsvDBM/Untitled?node-id=9-4&t=VzzGOgmtSd1NI46q-1)
* **Trello:** [Trello](https://trello.com/b/YJp7hDhI/tonica)

**Cuenta de demostración precargada:**
* **Correo:** `demo@tonica.com`
* **Contraseña:** `demo1234`

---

## 🎨 Temática y Funcionalidades

Elegimos la temática musical porque ya teníamos un TP que habíamos hecho en la materia de Arte en 4to cuya estética nos había llamado bastante la atención, aunque estaba bastante incompleto. Con las tecnologías que aprendimos en 5to vimos la oportunidad de poder darle un buen cierre a este proyecto que antes estaba inconcluso.

Las vistas son bastante intuitivas: la home te muestra un pequeño pantallazo de las canciones y álbumes que podés explorar para que luego te dirijas a esta pestaña. La pestaña explorar te muestra con más detalle esto: tiene filtros por género, relevancia y orden alfabético; también hay una barra de búsqueda. Al cliquear una canción entrás en la pestaña detalle, que te muestra en detalle la canción o álbum: ahí la podés guardar, valorar o incluso escribir una reseña. La pestaña de playlists te muestra las playlists que podés crear con las canciones que podés guardar; asimismo, si hacés click en una entrás en playlist detalle, donde podrás editar tus playlists. Por otro lado, el perfil te permite elegirte un nombre de usuario, cambiarte de foto, elegir tus géneros favoritos y ponerte una descripción, registrando todos los cambios a la derecha de la pestaña. La biblioteca te permite tener un registro de tus canciones y álbumes favoritos, escuchados y valorados, con filtros que facilitan esta búsqueda. Por último, las estadísticas muestran tus minutos escuchados, tu valoración promedio y canciones guardadas, entre otros.

## 🏗️ Arquitectura del Proyecto
El front y back se comunican mediante la URL desplegada del backend, que el front consume mediante axios para realizar las consultas necesarias. Por su parte, la arquitectura general se basa en:

```text
TONICA/
├── backend/
│   ├── .env.example
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── repositories/
│       ├── services/
│       └── routes/
└── frontend/
    └── src/
        ├── api/
        ├── componentes/
        ├── pages/
        └── context/
---

## 💻 Instalación Local y Comandos

### 1. Clonar el repositorio
```bash
git clone [https://github.com/iara-szw/Tonica.git]
cd Tonica
```
### 2. Correr el Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Correr el Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Variables de Entorno Necesarias

Crear un archivo `.env` en `backend/` (tomando como referencia `backend/.env.example`):

```env
la base de datos esta en render como dpg-dbk9qdmc6qcc73dv54e0-a
PORT=5000
JWT_SECRET=tu_clave_secreta
FRONTEND_URL=http://localhost:5173
```

Crear un archivo `.env` en `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🌍 API Externa

* **API utilizada:** Usamos MusicBrainz API y su derivada Cover Art Archive, esto debido a que es completamente gratuito, tiene acceso a nombres, lanzamiento, géneros y portadas y otras alternativas como spotify api son de pago.

* **Cómo se usa en la app:** Usamos la API de MusicBrainz para obtener los datos mediante su búsqueda básica con tipo y nombre de canción/álbum/artista y su búsqueda por detalle mediante id externo. El mismo id externo después lo guardamos y utilizamos para futuras búsquedas y la búsqueda de la portada en Cover Art Archive.
---

## 🗄️ Modelo de Datos


* **`usuarios`:** Nombre, mail, contraseña, url del avatar y preferencias.
* **`canciones`:** Cache local de canciones, id externo para realizar las busquedas, titulo, artista,etc.
* **`items_biblioteca`:** Datos de la relacion persona-cancion/artista/album 
* **`playlists`:** datos de cada playlist (como nombre, descripción y portada)
* **`playlist_items`:** Datos de la relacion playlist-cancion
* **`actividad_usuario`:** Guarda las acciones del usuario recientes

---

## 🛡️ Estrategia de Autenticación

Usamos un hash de la contraseña con bcrypt para la seguridad y una vez alguien logueado utilizamos el token de JWT para mantener la sección. Este token se reutiliza para todos los endpoints que requiere authorization y tiene un plazo de 24h


---

## 📡 Endpoints del Backend

Base URL local: `http://localhost:5000/api`  
Base URL producción: `https://tonica-9hyg.onrender.com/api`  
*(Las rutas marcadas con **Auth: Sí** requieren el header `Authorization: Bearer <token>`)*

### Autenticación y Perfil (`/api/auth`)
| Método | Ruta | Auth | Body / Params | Respuesta esperada |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | No | `{ nombre_usuario, correo, password, confirmPassword }` | `201` - Usuario creado |
| `POST` | `/api/auth/login` | No | `{ correo, password }` | `200` - Token JWT + datos del usuario |
| `GET` | `/api/auth/me` | Sí | — | `200` - Sesión activa y payload del token |
| `GET` | `/api/auth/profile` | Sí | — | `200` - Perfil completo desde la BD |
| `PUT` | `/api/auth/profile` | Sí | `{ nombre_usuario?, avatar_url?, bio?, preferencias? }` | `200` - Perfil actualizado |

### Música / API Externa (`/api/musica`)
| Método | Ruta | Auth | Query / Params | Respuesta esperada |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/musica/search` | No | `?q=texto&type=track\|album\|artist` | `200` - Lista de resultados de MusicBrainz |
| `GET` | `/api/musica/detalle/:type/:id` | No | `type`, `id` (MBID) | `200` - Detalle del ítem seleccionado |

### Biblioteca y Reseñas (`/api/biblioteca`)
| Método | Ruta | Auth | Body / Params | Respuesta esperada |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/biblioteca` | Sí | — | `200` - Ítems guardados del usuario |
| `POST` | `/api/biblioteca` | Sí | `{ id_externo, tipo, interact: { estado, es_favorito, puntuacion, resena } }` | `200` - Ítem guardado/actualizado |
| `PUT` | `/api/biblioteca/:id_cancion/resena` | Sí | `id_cancion` / `{ resena }` | `200` - Reseña creada o editada |
| `DELETE` | `/api/biblioteca/:id_cancion/resena` | Sí | `id_cancion` | `200` - Reseña eliminada |
| `DELETE` | `/api/biblioteca/:id_cancion` | Sí | `id_cancion` | `200` - Ítem quitado de la biblioteca |

### Playlists (`/api/playlists`)
| Método | Ruta | Auth | Body / Params | Respuesta esperada |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/playlists` | Sí | — | `200` - Playlists del usuario |
| `GET` | `/api/playlists/:id` | Sí | `id` | `200` - Playlist con sus canciones |
| `POST` | `/api/playlists` | Sí | `{ nombre, descripcion? }` | `201` - Playlist creada |
| `PUT` | `/api/playlists/:id` | Sí | `id` / `{ nombre, descripcion?, foto_url? }` | `200` - Playlist actualizada |
| `DELETE` | `/api/playlists/:id` | Sí | `id` | `200` - Playlist eliminada |
| `POST` | `/api/playlists/:id/items` | Sí | `id` / `{ id_externo, tipo }` | `200` - Contenido agregado a la playlist |
| `DELETE` | `/api/playlists/:id/items/:id_cancion` | Sí | `id`, `id_cancion` | `200` - Contenido quitado de la playlist |

### Estadísticas y Actividad
| Método | Ruta | Auth | Query / Params | Respuesta esperada |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/estadisticas` | Sí | — | `200` - Indicadores calculados del usuario |
| `GET` | `/api/actividad` | Sí | `?limit=20` (opcional) | `200` - Lista de actividad reciente |
