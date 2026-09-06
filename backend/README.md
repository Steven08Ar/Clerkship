# `pruebas/back` — Backend

> Estructura completa creada vacía; se va llenando poco a poco, servicio por servicio. **`flask-api` ya tiene auth + usuarios + cursos + articulos + chats + comunidad implementados** (ver abajo). Falta `consultas.py`, `historial.py`, `email.py` y todo `fastapi-service`.
>
> Este archivo describe el estado final del backend. El paso a paso de cómo se llegó ahí (incluyendo detalles de verificación, errores encontrados y cómo se resolvieron) está en [`pruebas/BITACORA.md`](../BITACORA.md). Para el detalle técnico de cómo Chats usa Postgres + Mongo juntos, con código explicado línea por línea, ver [`ARQUITECTURA_CHATS.md`](ARQUITECTURA_CHATS.md).

## Autenticación (`flask-api`) — LISTO

`app/models/`: `User`, `Student`, `Teacher` (SQLAlchemy, mapeados 1:1 a `pruebas/db/postgresql/01-users.sql`, `02-students.sql`, `03-teachers.sql`).

`app/routes/auth.py`, montado en `/api/auth`:

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/register` | Crea `users` + fila en `students`/`teachers` según `role`. Genera `username` automáticamente del correo (`sarias202@unab.edu.co` → `@sarias202`, con sufijo numérico si ya existe). Hashea la contraseña con `werkzeug.security` (nunca se guarda en texto plano). Devuelve `access_token` + `refresh_token`. |
| `POST` | `/api/auth/login` | Verifica email + contraseña contra `password_hash`. Devuelve `access_token` + `refresh_token`. |
| `POST` | `/api/auth/refresh` | Con el `refresh_token`, emite un `access_token` nuevo sin pedir contraseña de nuevo. |
| `GET` | `/api/auth/me` | Devuelve el usuario autenticado (a partir del `access_token`). |
| `POST` | `/api/auth/change-password` | Cambia la contraseña, valida la actual primero. |

Tokens **JWT** (`flask-jwt-extended`) — sin sesiones ni cookies del lado del servidor, el frontend guarda el `access_token` y lo manda en `Authorization: Bearer <token>`.

Verificado contra Supabase real: `register` → `login` → `me` → rechazo con contraseña incorrecta (401) → rechazo sin token (401). Todo probado de punta a punta, no solo en local.

## Usuarios, Cursos, Biblioteca, Chats, Comunidad (`flask-api`) — LISTO

Modelos SQLAlchemy nuevos en `app/models/`: `Course`, `StudentCourse`, `Article`, `ArticleTag`, `StudentLibrary`, `AiAgent`, `Conversation`, `ConversationParticipant`, `CommunityPost`, `CommunityComment`, `CommunityLike` — todos mapeados 1:1 a las tablas de `pruebas/db/postgresql/10-*.sql` a `17-*.sql`.

Nuevo `app/utils.py`: `get_current_user()` (JWT → fila de `User`) y `role_required(*roles)` (decorador que exige JWT válido + rol específico, usado para que solo `TEACHER` pueda crear cursos/artículos).

`flask-api` ahora también habla con **Mongo** (antes solo con Postgres): `app/__init__.py` expone `get_mongo_db()`, usado por `chats.py` para la colección `messages`. `MONGODB_URI`/`MONGODB_DB_NAME` ya estaban en el `.env` desde el setup de Atlas.

| Ruta | Endpoints |
|---|---|
| `usuarios.py` (`/api/usuarios`) | `GET /buscar?q=` (por prefijo de `@username`), `GET /<id>` (perfil público), `PATCH /me` (editar nombre) |
| `cursos.py` (`/api/cursos`) | `GET` (listar todos), `GET /mios` (los del usuario: dictados si `TEACHER`, matriculados si `STUDENT`), `POST` (crear, solo `TEACHER`), `GET /<id>`, `POST`/`DELETE /<id>/matricular` (solo `STUDENT`) |
| `articulos.py` (`/api/articulos`) — Biblioteca | `GET` (filtros `type`, `specialty`, `tag`, `q`), `POST` (crear con tags, solo `TEACHER`), `GET /<id>`, `GET /estante` (estante propio, solo `STUDENT`), `POST`/`DELETE /<id>/estante` (guardar/quitar, con `status` NEXT/FINISHED) |
| `chats.py` (`/api/chats`) | `GET` (mis conversaciones, con `last_read_at` de cada participante y vista previa del último mensaje), `POST` (crear/reutilizar, tipo DIRECT/GROUP/PUBLIC), `GET`/`POST /<id>/mensajes` (Mongo — texto, adjunto o nota de voz; marca `last_read_at` al leer), `POST`/`GET /<id>/typing` ("está escribiendo", en memoria, no en ninguna base) |
| `comunidad.py` (`/api/comunidad`) | `GET`/`POST /posts`, `DELETE /posts/<id>` (solo el autor), `GET`/`POST /posts/<id>/comentarios`, `POST /posts/<id>/like` (toggle) |

**Bug real encontrado y corregido durante la prueba de `chats.py`:** al crear una conversación con varios participantes en el mismo `commit()`, SQLAlchemy 2.x lanzaba `InvalidRequestError: Can't match sentinel values...` porque `user_id` llegaba como `string` sin convertir mientras `conversation_id` ya era un `UUID` de Python — el mecanismo de `RETURNING` de SQLAlchemy no podía emparejar los tipos entre lo insertado y lo devuelto por Postgres. Fix: convertir cada `participant_id` a `uuid.UUID(...)` antes de crear las filas. Detalle completo en `pruebas/BITACORA.md`.

**Verificado con datos reales contra Supabase + Mongo Atlas** (no solo local): se registraron un `TEACHER` y un `STUDENT` de prueba, se creó un curso y se matriculó al estudiante, se creó un artículo con tags y se guardó en el estante, se creó una conversación DIRECT y se intercambiaron mensajes reales en Mongo, se creó una publicación de comunidad con comentario y like (y se probó el toggle de "quitar like"). Todo funcionó. Los datos de prueba se borraron al terminar.

**Observación de diseño (no es un bug, queda anotada):** `conversations` no tiene una FK con `ON DELETE CASCADE` hacia ningún usuario "dueño" — cuando se borraron los usuarios de prueba, la fila de `conversations` quedó huérfana (sin participantes) en vez de borrarse sola, porque el borrado en cascada solo aplica a `conversation_participants`. Es el comportamiento esperado para una conversación `PUBLIC` o `GROUP` (no debería desaparecer solo porque un participante se borra), pero para `DIRECT` podría acumular filas huérfanas con el tiempo si ambos participantes se borran. Se limpió a mano en la prueba; no se implementó ninguna limpieza automática todavía.

## Chats — funcionalidades completas (frontend + backend)

Todo lo de abajo está implementado y probado contra Supabase + Mongo Atlas reales (no solo local). El detalle técnico línea por línea de cómo Postgres y Mongo trabajan juntos para cada una está en [`ARQUITECTURA_CHATS.md`](ARQUITECTURA_CHATS.md); el paso a paso de cómo se construyó cada una (con los bugs encontrados en el camino) está en [`BITACORA.md`](../BITACORA.md).

- **Mensajería casi en tiempo real**: poll de mensajes cada 1s mientras una conversación está abierta (no hay WebSockets todavía — es la limitación conocida). Envío **optimista**: el mensaje propio aparece en 0ms, se reconcilia con el real del servidor apenas responde, con deduplicación por contenido para evitar la condición de carrera de "mensaje duplicado" que apareció al construir esto.
- **"Está escribiendo..."**: por polling (no WebSockets), estado efímero en memoria del proceso de Flask (`_typing_state`), expira solo a los 4s.
- **Chulos de "leído" reales**: usa `conversation_participants.last_read_at` (columna que ya existía en el esquema desde el principio, nunca se había usado hasta ahora). Un chulo = entregado; doble chulo = leído por todos los demás participantes. Color: azul oscuro (`--p-dk`) en modo claro, verde-azul neón con resplandor en modo oscuro.
- **Notas de voz reales**: grabación con `MediaRecorder` + `Web Audio API` (Opus a 24 kbps, ~180 KB/min — pensado para pesar poco porque se guarda como base64 dentro del mensaje en Mongo, no hay bucket de archivos todavía). Forma de onda en vivo mientras grabás, pausar/reanudar real, y al reproducir: forma de onda clicable para adelantar/atrasar (estilo WhatsApp) y 5 velocidades (0.5x–2x). **Solo una nota de voz suena a la vez** (un coordinador a nivel de módulo pausa cualquier otra), y **las notas de voz seguidas se encadenan solas** al terminar la anterior. Ver sección 8 de `ARQUITECTURA_CHATS.md` para el detalle completo.
- **Vista previa del último mensaje** en la lista de chats (en vez del cargo del otro participante) — una sola consulta agregada a Mongo (`$group` por conversación) trae el último mensaje de todas las conversaciones de una vez.
- **Avatares reales** (generados, consistentes por persona vía DiceBear — no hay fotos subidas de verdad todavía, no hay columna para eso ni almacenamiento de archivos) en vez de iniciales-en-círculo.
- **Responsive mobile completo**: en pantallas angostas, la lista y la conversación activa ocupan toda la pantalla por separado (no una al lado de la otra), con botón "Volver" real para pasar de una a otra — y **ya no se auto-abre ninguna conversación** al entrar a Chats, se ve la lista primero. Nombres cortos (primer nombre + primer apellido) en mobile, completos en escritorio.
- **Renovación automática de sesión**: el `access_token` dura 60 min; si vence, el cliente HTTP centralizado (`apiClient.ts`) lo renueva solo con el `refresh_token` y reintenta, sin pedirle credenciales de nuevo al usuario. Deduplicado para no disparar más de una renovación si varios pedidos fallan al mismo tiempo.
- **Archivos adjuntos reales** (imágenes, PDFs, documentos): se suben de verdad (antes solo se guardaba nombre/tamaño simulados), comprimidos en el navegador si son imágenes (canvas, máx. 1600px, JPEG calidad 0.75) antes de mandarse como base64, con tope de ~10 MB validado en frontend y backend. Vista previa inline en la conversación: miniatura clicable para imágenes, PDF renderizado directo en un `<iframe>` (sin librería, motor nativo del navegador), y tarjeta de descarga para el resto de documentos. Ver sección 9 de `ARQUITECTURA_CHATS.md`.
- **Vista previa de links de video**: si un mensaje de texto contiene un link de YouTube o Vimeo, se muestra una miniatura clicable debajo del mensaje que, al tocarla, se expande en un reproductor embebido ahí mismo — igual que la vista previa de un PDF, sin salir del chat. Miniatura de YouTube vía su URL pública (sin API key).

**Archivos de frontend involucrados:**
- `frontend/src/data/apiClient.ts` — cliente HTTP centralizado con renovación automática de token (lo usan Chats y, en el futuro, cualquier módulo nuevo).
- `frontend/src/data/chatsApi.ts` — todas las llamadas a `/api/chats` y `/api/usuarios/buscar`.
- `frontend/src/utils/audioRecorder.ts` — grabación real de notas de voz.
- `frontend/src/utils/audioPlaybackCoordinator.ts` — coordina que solo suene una nota de voz a la vez y encadena las seguidas.
- `frontend/src/utils/avatar.ts` — avatares generados (DiceBear), reusado también por el Sidebar.
- `frontend/src/utils/fileUpload.ts` — compresión de imágenes y armado del adjunto real (base64 + validaciones).
- `frontend/src/utils/linkPreview.ts` — extracción del primer link de un mensaje de texto.
- `frontend/src/components/chats/VoiceMessagePlayer.tsx` — reproductor de notas de voz.
- `frontend/src/components/chats/FileAttachmentPreview.tsx` — vista previa de imágenes/PDFs/documentos.
- `frontend/src/components/chats/LinkPreviewCard.tsx` — vista previa de links de YouTube/Vimeo.
- `frontend/src/pages/chats/ChatsPage.tsx` — la pantalla completa (Chats real + Comunidad placeholder). El Buzón mock que vivía acá se eliminó — ver sección de abajo, ahora es real y está en su propia página.

## Buzón — real, 100% independiente de Chats (Mailgun)

Dirección real `{username}@clerk-ship.online` por usuario, con autorización explícita antes de crear la cuenta. Manda a cualquier dirección real (dominio ya verificado en Mailgun, sin restricción de sandbox) y recibe de cualquier dominio — sin necesitar un servidor público: en vez de un webhook, el backend sincroniza los correos entrantes preguntándole él mismo a la API de Mailgun (`GET /events` + `GET` a la URL de storage), cada vez que se pide la bandeja de entrada. Detalle técnico completo y el registro MX pendiente de agregar en `BITACORA.md` (entrada del 2026-08-17, "Buzón real").

- `pruebas/back/flask-api/app/mailbox.py` — envío, sincronización de entrantes, creación de la Ruta de Mailgun.
- `pruebas/back/flask-api/app/routes/mailbox.py` (`/api/mailbox`) — status, setup, listar/leer/mandar/actualizar/borrar mensajes.
- `frontend/src/pages/mailbox/MailboxPage.tsx` (`/buzon`) — ícono propio en el Sidebar general, pantalla de autorización (wizard de 3 pasos + términos y condiciones), bandeja de 3 columnas (carpetas/lista/lectura), redactar/responder/reenviar/destacar/eliminar, adjuntos.

## Dashboard — Carpetas y Documentos reales (`flask-api`) — LISTO

Antes era 100% mock (carpetas y "Recientes" hardcodeados, "Nuevo" no hacía nada). Ahora es real: crear/editar/eliminar carpetas con **color propio elegido por el usuario** (selector de color con diseño propio, no el nativo del navegador — ver `ColorPickerPopover.tsx`), subir/descargar/renombrar/eliminar documentos, todo persistido de verdad. Mismo patrón Postgres+Mongo que Chats/Buzón: la carpeta (dueño, nombre, color) vive en `document_folders` (Postgres); el archivo real (bytes + metadata) vive en Mongo (`documents`, base64, sin bucket todavía).

- `pruebas/back/flask-api/app/routes/documentos.py` (`/api/documentos`) — CRUD de carpetas y documentos, con conteo de archivos/tamaño por carpeta calculado en vivo (agregación de Mongo, no un campo que se pueda desincronizar).
- `frontend/src/pages/dashboard/DashboardPage.tsx` — carpetas + "Recientes" reales, entrar a una carpeta muestra su contenido dentro del mismo Dashboard (sin navegar a otra página).
- `frontend/src/components/dashboard/{FolderModal.tsx, UploadDocumentModal.tsx}`.
- `frontend/src/components/shared/ColorPickerPopover.tsx` + `frontend/src/utils/color.ts` — selector de color propio (cuadro saturación/brillo + slider de matiz + hex a mano), usado acá y también en el color de fondo del avatar del registro.

## Frontend conectado a este login — LISTO

- `frontend/src/data/mainAuth.ts` ya llama a `/api/auth/login` de este backend (antes llamaba a Firebase), y ya tiene `refreshAccessToken()` para renovar el `access_token` solo.
- `frontend/src/pages/auth/LoginPage.tsx` ya no tiene el paso de "contraseña temporal" (era específico del truco de Firebase con 6 cuentas de prueba — no aplica al backend real, donde cada quien pone su propia contraseña al registrarse).
- `frontend/src/pages/auth/RegisterPage.tsx` **ya sirve de verdad** (antes era un mock) — pide rol (Estudiante/Docente), nombre, apellido, código de estudiante si aplica, correo y contraseña, y llama a `POST /api/auth/register`.
- **Registro con verificación de correo real** (código de 6 dígitos por Mailgun, modo simulado — consola del backend — hasta que se verifique `clerk-ship.online` en Mailgun) + **selector/creador de avatar 100% DiceBear** (guardado como SVG real en `users.avatar_svg`). Flujo completo: `RegisterPage.tsx` (form → verify → avatar) → `POST /api/auth/register` → `POST /api/auth/verify-email` → `POST /api/auth/avatar`. `LoginPage.tsx` también redirige a verificar si una cuenta quedó a medias. Ver la entrada del 2026-08-17 en `BITACORA.md` para el detalle completo.
- `frontend/src/utils/currentUser.ts` (usado por Sidebar, WelcomeOverlay y Chats) ya lee la sesión de este backend en vez de Firebase.
- `frontend/src/data/devAuth.ts` y todo el Módulo de Desarrollo (`/desarrollo`, `/cuestionario`, `/cronograma`) **siguen 100% Firebase, sin tocar**.
- `frontend/.env` tiene `VITE_API_BASE_URL=http://localhost:5000`.
- Probado end-to-end con requests HTTP reales (register + login + refresh + CORS con origen `localhost:5173`). Falta confirmación visual en navegador — no hay uno disponible en este entorno (aunque el usuario sí lo probó en su propio navegador y confirmó que Chats con audio funciona).

## MongoDB Atlas — LISTO

- Cluster `clase` en el proyecto `Clerkship-prueba`, base `clerkship`.
- Colecciones `consultations` y `messages` creadas con sus índices, verificado que coinciden exactamente con `pruebas/db/mongodb/01-init.js` y `02-messages.js`.
- `MONGODB_URI` / `MONGODB_DB_NAME` ya están en el `.env` de `flask-api` y de `fastapi-service` (ambos van a necesitar Mongo: `flask-api/routes/chats.py` para `messages`, `fastapi-service` para el documento de cada consulta).
- **Pendiente**: rotar la contraseña de este usuario de Mongo (`sarias202`) — quedó escrita en el chat en algún punto de la configuración.

## Dos servicios, por qué

- **`flask-api/`** — el backend "de negocio": todo lo que es CRUD estructurado contra **PostgreSQL/Supabase** (usuarios, cursos, artículos/biblioteca, historial) más las rutas de **Chats** y **Comunidad**, que combinan Postgres (metadata) con MongoDB (contenido — mensajes). Es el que valida el login (`password_hash` propio, ya definido en `pruebas/db/postgresql/01-users.sql`).
- **`fastapi-service/`** — el motor de IA de las simulaciones clínicas: el agente que conversa con el estudiante (`agente_clinico.py`), la comparación contra el caso de referencia (`ground_truth.py`) y la generación de la evaluación (`evaluador.py`). Trabaja principalmente contra el documento de **MongoDB** de cada consulta (`case`, `chat_history`, `ai_evaluation` — diseño propuesto en `docs/contexto-base-datos-postgresql-mongodb.md`, todavía sin implementar el detalle porque Casos Clínicos sigue pendiente de hablar con el equipo).

Aviso importante sobre el split: **no es una regla estricta de "un servicio = una base de datos"**. `flask-api/routes/chats.py` va a necesitar tocar Mongo también (para la colección `messages`), y `fastapi-service` va a necesitar escribir de vuelta en Postgres (el score final de una consulta). El split real es por *responsabilidad* (CRUD de negocio vs. motor de IA), no por base de datos.

## Dejar la base de datos lista en Supabase — necesito algo tuyo

No tengo acceso ni credenciales de tu proyecto de Supabase (no hay ninguna integración conectada en este entorno), así que no puedo aplicar el esquema yo directamente. Dejé todo listo para que sea rapidísimo de tu lado, dos formas de hacerlo:

**Opción A — la más simple, sin compartir nada conmigo (recomendada):**
1. Entra a tu proyecto en supabase.com → **SQL Editor**.
2. Abre `pruebas/db/postgresql/APPLY_ALL.sql` (lo generé ahora, concatena los 19 archivos en orden).
3. Copia todo el contenido, pégalo en el SQL Editor y dale **Run**. Se crea el esquema completo de una vez.

**Opción B — si quieres que yo lo aplique y verifique por ti:**
Crea el archivo `pruebas/back/flask-api/.env` (ya está en `.gitignore`, nunca se sube) con tu cadena de conexión real:
```
DATABASE_URL=postgresql+psycopg2://postgres:TU-PASSWORD@TU-HOST.supabase.co:5432/postgres
```
La sacas de tu proyecto en Supabase → **Project Settings → Database → Connection string**. Cuando ese archivo exista localmente, te aviso y lo uso para correr el script y confirmar que las 19 tablas quedaron creadas — sin que la contraseña pase por el chat en ningún momento.

## 3 ajustes que hice sobre el esquema de ejemplo (avísame si prefieres deshacer alguno)

1. **Se agregaron `routes/chats.py` y `routes/comunidad.py`** a `flask-api` — no estaban en el esquema que compartiste, pero ya construimos el esquema de base de datos completo para Chats y Comunidad (`conversations`, `messages`, `community_posts`, etc.), así que les hacía falta su ruta.
2. **No se crearon carpetas `venv/`** — un entorno virtual se genera localmente con `python -m venv venv` cuando alguien vaya a trabajar, no se versiona ni se crea a mano. En su lugar agregué un `.gitignore` en cada servicio que ya lo excluye (junto con `__pycache__/` y `.env`).
3. **`.env` → `.env.example`** — mismo criterio que ya se usó en `frontend/.env.example`: el archivo real con secretos nunca se commitea, solo la plantilla vacía. Cuando llenemos la configuración real, cada quien crea su propio `.env` local a partir de esa plantilla.

## Sobre la carpeta `database/` del esquema original

No se duplicó. Los scripts de inicialización de Postgres y Mongo ya existen y son la fuente de verdad en `pruebas/db/postgresql/` y `pruebas/db/mongodb/` (ver `pruebas/CAMBIOS.md`). Copiarlos dentro de `back/` habría creado dos versiones para mantener sincronizadas. Cuando se arme el `docker-compose.yml` para levantar todo junto, simplemente va a apuntar a `../db/postgresql` y `../db/mongodb` como carpetas de init.

## Estructura final

```
back/
├── flask-api/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── utils.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py            ← listo
│   │   │   ├── usuarios.py        ← listo
│   │   │   ├── cursos.py          ← listo
│   │   │   ├── articulos.py       ← listo
│   │   │   ├── chats.py           ← listo
│   │   │   ├── comunidad.py       ← listo
│   │   │   ├── consultas.py       ← vacío, pendiente (Casos Clínicos)
│   │   │   ├── historial.py       ← vacío, pendiente
│   │   │   └── email.py           ← vacío, pendiente
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── user.py, student.py, teacher.py
│   │       ├── course.py, student_course.py
│   │       ├── article.py, article_tag.py, student_library.py
│   │       ├── ai_agent.py, conversation.py, conversation_participant.py
│   │       └── community_post.py, community_comment.py, community_like.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   └── app.py
│
└── fastapi-service/
    ├── app/
    │   ├── __init__.py
    │   ├── main.py
    │   ├── config.py
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── agente_clinico.py
    │   │   ├── ground_truth.py
    │   │   └── evaluador.py
    │   └── models/
    │       └── __init__.py
    ├── requirements.txt
    ├── .env.example
    └── .gitignore
```
