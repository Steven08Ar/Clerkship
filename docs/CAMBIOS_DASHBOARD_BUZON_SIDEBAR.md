# Cambios recientes: Dashboard (Carpetas/Documentos), Buzón y Sidebar

> Documentación técnica de todo lo construido/arreglado en esta tanda de trabajo: quién lo pidió, cómo funciona, qué código quedó, y qué falta. Complementa a `SISTEMA_GESTION_DOCUMENTAL_Y_VISTAS_PREVIAS.md` (que documenta las vistas previas de PDF/Word/Excel/PPT) — este documento se enfoca en carpetas/documentos como CRUD real, el Buzón y el Sidebar.

---

## 1. Resumen de lo que se hizo

| Área | Qué se hizo |
|---|---|
| Dashboard → Documentos | CRUD real de carpetas y documentos (Postgres + MongoDB), colores personalizados, **subcarpetas (carpeta dentro de carpeta)**, renombrar sin poder tocar la extensión, spinner de "Descargando..." |
| Selector de color | Color picker propio (cuadro de saturación/valor + slider de tono + hex manual), reemplaza el `<input type="color">` nativo del navegador, usado en carpetas y en el avatar del registro |
| Rendimiento | Backend Flask corría de a una petición a la vez (`threaded=True` faltante) — pantallas que pedían varias cosas en paralelo (carpetas+recientes, mensajes+chats) se sentían lentas sin serlo realmente. Se agregaron índices en Mongo. |
| Buzón (`/buzon`) | Se blindó el wizard de consentimiento: mientras no se confirma el estado real (`mailbox_created`) contra el backend, no se muestra nada del buzón — antes había un instante donde se filtraba la UI del buzón antes de saber si correspondía el wizard. |
| Sidebar | Arreglado el crash de pantalla blanca en `/buzon` (`Cannot read properties of undefined (reading 'groups')`) — faltaba la entrada `mailbox` en el objeto `PANEL`. |

---

## 2. Dashboard → Carpetas y Documentos

### 2.1 Modelo de datos (híbrido Postgres + Mongo, mismo patrón que Chats/Buzón)

- **PostgreSQL (Supabase)** — tabla `document_folders`: quién es dueño, nombre, color, y desde esta sesión también `parent_folder_id` (subcarpetas).
- **MongoDB Atlas** — colección `documents`: el archivo real como base64 (no hay bucket S3 conectado), con `folder_id` como string suelto (no FK real, se valida a mano en el backend).

```sql
-- pruebas/db/postgresql/21-document-folders.sql
CREATE TABLE document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#0284C7',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_folder_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_document_folders_owner ON document_folders(owner_user_id);

-- pruebas/db/postgresql/22-document-folders-nesting.sql  (aplicada en vivo contra Supabase)
ALTER TABLE document_folders ADD COLUMN parent_folder_id UUID NULL;
ALTER TABLE document_folders ADD CONSTRAINT fk_folder_parent
    FOREIGN KEY (parent_folder_id) REFERENCES document_folders(id) ON DELETE CASCADE;
CREATE INDEX idx_document_folders_parent ON document_folders(parent_folder_id);
```

`parent_folder_id` es `NULL` para carpetas de nivel raíz. `ON DELETE CASCADE` hace que Postgres borre solo las filas de las subcarpetas cuando se borra la carpeta padre — pero **no** borra los documentos de Mongo de esas subcarpetas (eso lo hace el backend a mano, ver 2.3).

Índices reales creados en Mongo (colección `documents`, sin migración versionada — se crearon a mano vía script durante la sesión, **pendiente** dejarlos en un script repetible):
```
owner_user_id_1_folder_id_1
owner_user_id_1_created_at_-1
```

### 2.2 Modelo SQLAlchemy

`pruebas/back/flask-api/app/models/document_folder.py`:
```python
class DocumentFolder(db.Model):
    __tablename__ = "document_folders"
    id = db.Column(UUID(as_uuid=True), primary_key=True, server_default=db.text("uuid_generate_v4()"))
    owner_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_folder_id = db.Column(UUID(as_uuid=True), db.ForeignKey("document_folders.id", ondelete="CASCADE"), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    color = db.Column(db.String(7), nullable=False, server_default="#0284C7")
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now())
```

### 2.3 Endpoints (`pruebas/back/flask-api/app/routes/documentos.py`, prefijo `/api/documentos`)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/carpetas` | Lista carpetas del usuario, con `file_count`, `total_size_bytes` (agregación Mongo) y `subfolder_count` (contado en memoria a partir de todas sus carpetas). |
| `POST` | `/carpetas` | Crea carpeta. Acepta `parent_folder_id` opcional — si viene, valida que esa carpeta padre exista y sea del mismo usuario. |
| `PATCH` | `/carpetas/<id>` | Edita nombre/color, o **mueve** la carpeta cambiando `parent_folder_id`. Valida: no puede ser su propia padre, y no puede moverse dentro de una de sus propias subcarpetas (anti-ciclo, ver `_descendant_ids`). |
| `DELETE` | `/carpetas/<id>` | Borra la carpeta. Postgres cascadea las filas de subcarpetas solo; el backend calcula `_descendant_ids()` para borrar en Mongo los documentos de la carpeta **y de todas sus subcarpetas** a cualquier profundidad. |
| `GET`/`POST` | `/documentos` | Listar (con `folder_id` opcional) / subir documento. Límite `MAX_DOCUMENT_BASE64_CHARS = 15*1024*1024` (~11 MB reales). |
| `GET`/`PATCH`/`DELETE` | `/documentos/<id>` | Ver completo (con base64), renombrar/mover, borrar. |

**Anti-ciclo al mover carpetas** (`_descendant_ids`, recorrido iterativo con pila, no recursión):
```python
def _descendant_ids(user_id, root_id: str) -> list:
    """IDs de todas las subcarpetas (a cualquier profundidad) de root_id, sin incluirlo."""
    all_folders = DocumentFolder.query.filter_by(owner_user_id=user_id).all()
    children_of: dict = {}
    for f in all_folders:
        parent = str(f.parent_folder_id) if f.parent_folder_id else None
        children_of.setdefault(parent, []).append(str(f.id))

    result = []
    stack = list(children_of.get(root_id, []))
    while stack:
        fid = stack.pop()
        result.append(fid)
        stack.extend(children_of.get(fid, []))
    return result
```

**Extensión bloqueada al renombrar documentos** (mismo criterio en frontend y backend):
```python
def _extension_of(name: str) -> str:
    dot = name.rfind(".")
    return name[dot:] if dot > 0 else ""

# en actualizar_documento():
original_ext = _extension_of(doc.get("name") or "")
new_base = name[: len(name) - len(_extension_of(name))] if _extension_of(name) else name
updates["name"] = f"{new_base}{original_ext}"
```
El frontend ya no deja editar la extensión en el input (solo el nombre base), pero el backend **la vuelve a forzar igual sin confiar en el cliente** — se probó mandando `malicioso.exe` como nuevo nombre y el documento se quedó como `malicioso.pdf`.

### 2.4 Frontend

- `frontend/src/data/documentosApi.ts` — cliente tipado (`DocumentFolder` ahora incluye `parent_folder_id` y `subfolder_count`).
- `frontend/src/components/dashboard/FolderModal.tsx` — modal de crear/editar carpeta, con swatches de colores fijos + `ColorPickerPopover` para color personalizado.
- `frontend/src/components/dashboard/UploadDocumentModal.tsx` — modal de subida.
- `frontend/src/pages/dashboard/DashboardPage.tsx` — pantalla principal, ver detalle de subcarpetas abajo.

#### Navegación entre carpetas (breadcrumb con pila)

Antes solo existía un nivel ("carpeta abierta" ↔ "raíz"). Para soportar subcarpetas se agregó una pila de ancestros:

```typescript
const [openFolder, setOpenFolder] = useState<DocumentFolder | null>(null);
const [folderStack, setFolderStack] = useState<DocumentFolder[]>([]);

async function openFolderView(folder: DocumentFolder) {
  if (openFolder) setFolderStack(prev => [...prev, openFolder]);
  await loadFolder(folder);
}

async function goBackFolder() {
  if (folderStack.length > 0) {
    const stack = [...folderStack];
    const parent = stack.pop()!;
    setFolderStack(stack);
    await loadFolder(parent);
  } else {
    setOpenFolder(null);
    setFolderStack([]);
  }
}
```

El título de la página muestra la ruta completa cuando hay ancestros: `Padre / Hijo / ...`.

#### Filtrado raíz vs. subcarpetas

```typescript
const sortedFolders = useMemo(
  () => sortFolders(folders.filter(f => !f.parent_folder_id), sortLabel),
  [folders, sortLabel],
);
const sortedChildFolders = useMemo(
  () => (openFolder ? sortFolders(folders.filter(f => f.parent_folder_id === openFolder.id), sortLabel) : []),
  [folders, sortLabel, openFolder],
);
```

- La sección "Carpetas" del nivel raíz (`Documentos`) solo muestra carpetas sin padre.
- Al entrar a una carpeta, si tiene subcarpetas, aparecen primero (mismo diseño de tarjeta 3D) y debajo sus documentos.
- El botón **"Nuevo → Nueva carpeta"** crea la carpeta dentro de `openFolder` si estás parado dentro de una (pasa `openFolder?.id` como `parent_folder_id`); si estás en la raíz, crea una carpeta raíz.

#### Tarjeta de carpeta reutilizable

Se extrajo el JSX de la tarjeta (antes duplicado inline en el `.map`) a una función `renderFolderCard(f)` para poder usarla tanto en la lista raíz como dentro de una carpeta abierta:

```typescript
function renderFolderCard(f: DocumentFolder) {
  const c = f.color || '#10B981';
  const metaParts = [
    f.subfolder_count > 0 ? `${f.subfolder_count} carpeta${f.subfolder_count === 1 ? '' : 's'}` : null,
    `${f.file_count} archivo${f.file_count === 1 ? '' : 's'}`,
    formatFileSize(f.total_size_bytes),
  ].filter(Boolean);
  // ...JSX de la carpeta 3D con .bib2-folder-tab-shape / .bib2-folder-front-flap...
}
```

#### Borrado en cascada (frontend)

Al borrar una carpeta que tiene subcarpetas, el backend ya las borra todas — el frontend también tiene que limpiarlas de su propio estado local (si no, quedarían "fantasma" en pantalla hasta el próximo refresh):

```typescript
function collectDescendantIds(allFolders: DocumentFolder[], rootId: string): string[] { /* mismo algoritmo que el backend */ }

async function handleDeleteFolder(folder: DocumentFolder) {
  await deleteFolder(folder.id);
  const toRemove = new Set([folder.id, ...collectDescendantIds(folders, folder.id)]);
  setFolders(prev => prev.filter(f => !toRemove.has(f.id)));
  if (openFolder && toRemove.has(openFolder.id)) { setOpenFolder(null); setFolderStack([]); }
}
```

#### Renombrar sin tocar la extensión (frontend)

```typescript
function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

function startRename(doc: DocumentSummary) {
  setRenamingId(doc.id);
  setRenameValue(splitExtension(doc.name).base);   // solo se edita la base
}
async function confirmRename(doc: DocumentSummary, fromFolder: boolean) {
  const { ext } = splitExtension(doc.name);
  const newName = `${renameValue.trim()}${ext}`;    // la extensión se pega de vuelta siempre
  await updateDocument(doc.id, { name: newName });
}
```
En el input de renombrar, la extensión se muestra como un sufijo fijo no editable (`.dfm-rename-ext`, `cursor: not-allowed`).

#### Spinner de "Descargando..."

La descarga trae el archivo completo (con los bytes en base64) recién al momento de descargar — el listado solo tiene metadata para que cargue rápido — así que en archivos grandes tarda un par de segundos. Sin feedback visual parecía que el botón no hacía nada:

```typescript
const [downloadingId, setDownloadingId] = useState<string | null>(null);

async function handleDownload(doc: DocumentSummary) {
  setDownloadingId(doc.id);
  try {
    const { document } = await getDocument(doc.id);
    const link = window.document.createElement('a');
    link.href = `data:${document.mime_type};base64,${document.data}`;
    link.download = document.name;
    link.click();
  } finally {
    setDownloadingId(null);
  }
}
```
El botón "Descargar" del menú se deshabilita y muestra `Loader2` + "Descargando..." mientras `downloadingId === doc.id`.

### 2.5 Colores de las carpetas (modo claro/oscuro)

Historial de este punto en la sesión (para que quede el razonamiento, no solo el resultado):

1. Primer intento: calcular el color del texto por luminancia perceptual del color de la carpeta (`getFolderTextColor`), para que fuera automáticamente blanco o casi-negro según qué tan clara fuera la carpeta. **Se descartó** — el usuario prefería texto siempre claro, nunca negro, sobre las carpetas.
2. Se probó subir la opacidad del fondo de la carpeta a valores casi sólidos. **Se revirtió** — el usuario pidió dejar el fondo como estaba originalmente (`BF`/`99`/`E6` de alpha).
3. Estado final: título y meta de la carpeta **siempre en blanco**, con distinta opacidad según el tema:

```css
/* frontend/src/styles/dashboard.css */
.bib2-folder-title-front {
  color: #FFFFFF;
  font-weight: 800;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}
.bib2-folder-meta-front {
  color: rgba(255, 255, 255, 0.96);
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}
[data-theme="light"] .bib2-folder-title-front,
[data-theme="light"] .bib2-folder-meta-front {
  color: rgba(255, 255, 255, 0.85);   /* blanco 85% en modo claro, pedido explícito */
}
```
En modo oscuro queda el blanco más intenso (96%/100%); en modo claro baja a 85% de opacidad. El color de fondo de la carpeta (`${c}BF`, `${c}99`, `${c}E6` sobre el `color` elegido por el usuario) **nunca se toca** — es decisión del usuario y no depende del tema.

### 2.6 Color picker propio

`frontend/src/utils/color.ts` (conversión HSV↔hex) + `frontend/src/components/shared/ColorPickerPopover.tsx` (cuadro de saturación/valor, slider de tono, input hex manual). Usa eventos `pointerdown/pointermove/pointerup` (no `mouse*`) para funcionar igual con mouse y touch. Reemplaza el `<input type="color">` nativo del navegador en:
- `FolderModal.tsx` (color de carpeta).
- `AvatarPickerStep.tsx` del registro (color de fondo del avatar DiceBear).

---

## 3. Rendimiento del backend

**Síntoma reportado**: carpetas y documentos del Dashboard tardaban mucho en aparecer.

**Causa real** (no percibida — se verificó con mediciones reales, no solo con el cliente de test de Flask que no simula concurrencia real): el servidor de desarrollo de Flask corría con `app.run(debug=True)` **sin `threaded=True`**. Eso significa que aunque el frontend pidiera varias cosas "en paralelo" con `Promise.all` (ej. carpetas + recientes), el servidor las procesaba **una por una, en fila**.

```python
# pruebas/back/flask-api/app.py
if __name__ == "__main__":
    app.run(debug=True, threaded=True)
```

Medido con un servidor real + `ThreadPoolExecutor` simulando el `Promise.all` del frontend: secuencial ~1400ms → en paralelo con `threaded=True` ~576–934ms (~2.4x). El resto de la latencia (~500-600ms) es el costo real de red hacia Supabase/MongoDB Atlas (ambos remotos) desde una máquina de desarrollo local — no se puede bajar más sin desplegar el backend cerca de las bases de datos.

Además se agregaron índices reales en Mongo (`documents`, y también `messages`/`mailbox_messages` para consistencia) — ver sección 2.1 para la lista exacta.

---

## 4. Buzón (`/buzon`) — wizard de consentimiento

**Regla de negocio**: si el usuario nunca autorizó crear su buzón real (`users.mailbox_created = false`), tiene que ver siempre el wizard de 3 pasos (dirección real → fines educativos → uso responsable + checkbox de términos) antes de poder ver nada del correo. Si ya lo autorizó, debe ir directo al buzón.

**Bug encontrado**: `MailboxPage.tsx` pedía el estado real con `getMailboxStatus()` al montar, pero mientras esa petición estaba en vuelo (`status === null`), la condición `if (status && !status.mailbox_created)` era `false` (porque `status` era `null`, no `true`) — así que por un instante se renderizaba la pantalla completa del buzón (columnas de carpetas, lista, panel de lectura) antes de que llegara la respuesta real y recién ahí cambiara al wizard si correspondía.

**Arreglo** — se agregó un tercer estado explícito ("todavía no sé") antes de decidir entre wizard o buzón real:

```typescript
// frontend/src/pages/mailbox/MailboxPage.tsx
if (!status) {
  return (
    <div className="dash-root">
      <Sidebar />
      <div className="mbx-authorize-wrap">
        {setupError ? <p className="mbx-authorize-error">{setupError}</p> : <Loader2 size={26} className="mbx-spin" />}
      </div>
    </div>
  );
}

if (!status.mailbox_created) {
  // ...wizard de 3 pasos (sin cambios)...
}

// ...buzón real (sin cambios)...
```
Ahora nunca se muestra nada del buzón hasta confirmar el estado real contra el backend; si la petición de estado falla, se muestra el error en vez de quedar cargando para siempre.

---

## 5. Sidebar — crash de pantalla blanca en `/buzon`

**Error real que reportó el usuario**:
```
Sidebar.tsx:134 Uncaught TypeError: Cannot read properties of undefined (reading 'groups')
```

**Causa**: `frontend/src/data/dashNav.ts` (`DASH_NAV`) ya tenía una entrada `mailbox` con ruta `/buzon`, pero el objeto `PANEL` dentro de `Sidebar.tsx` (que define qué se muestra en el panel expandible por cada sección) **nunca tuvo una entrada `mailbox`**. Al entrar a `/buzon`, `activeId` se volvía `'mailbox'` y `PANEL['mailbox']` era `undefined` → `undefined.groups` explotaba.

**Arreglo**:
```typescript
// frontend/src/components/shared/Sidebar.tsx
const PANEL: Record<string, PanelSection> = {
  // ...overview, casos, historial, biblioteca, chats...
  mailbox: {
    flat: [
      { label: 'Buzón', route: '/buzon' },
    ],
  },
};
```
Además se blindaron los tres puntos donde el código asumía que `PANEL[activeId]` siempre existe (`section.groups` → `section?.groups`, y `PANEL[activeId]` → `PANEL[activeId] ?? { flat: [] }`), para que si en el futuro se agrega un tab nuevo a `DASH_NAV` sin su entrada correspondiente en `PANEL`, la app no vuelva a quedar en pantalla blanca — en el peor caso el panel expandible sale vacío en vez de tirar toda la página.

> Nota histórica: en un punto de la sesión, `Sidebar.tsx` se revirtió por completo a su última versión commiteada (`git checkout HEAD -- Sidebar.tsx`) a pedido explícito del usuario, quien fue advertido de que eso reintroducía este mismo crash. El arreglo de esta sección es el que finalmente lo resolvió, ahora sí, de forma permanente.

---

## 6. Qué falta / pendiente

- **Índices de Mongo sin script versionado**: `owner_user_id_1_folder_id_1` y `owner_user_id_1_created_at_-1` en `documents` (y los de `messages`/`mailbox_messages`) se crearon a mano contra Atlas durante la sesión, no existen en ningún archivo del repo. Falta un script tipo `pruebas/db/mongodb/ensure_indexes.py` que los cree de forma idempotente, para poder recrear el entorno desde cero.
- **Sin bucket de almacenamiento real**: documentos, adjuntos de chats y adjuntos del buzón viven como base64 dentro de Mongo. Funciona para el prototipo, pero no escala a archivos grandes ni es lo ideal en costo/rendimiento a largo plazo — pendiente evaluar S3/GCS/Supabase Storage si el proyecto avanza a producción.
- **Sin `docker-compose.yml` ni seeds**: sigue sin existir una forma de levantar Postgres+Mongo local reproducible para desarrollo, hay que apuntar siempre a Supabase/Atlas reales.
- **Subcarpetas — límite de profundidad**: no hay límite explícito de cuántos niveles de subcarpeta se pueden anidar. Funciona igual a cualquier profundidad, pero no se probó con jerarquías muy profundas ni se diseñó una UI para breadcrumbs muy largos (hoy se listan todos seguidos con `/`, sin truncar).
- **`UploadDocumentModal`**: el selector de carpeta destino al subir un documento sigue mostrando todas las carpetas del usuario en una sola lista plana (sin indentar por jerarquía) — con subcarpetas activas, valdría la pena mostrar la jerarquía visualmente ahí también.
- **Roles ENUM de `users`** (`STUDENT`/`TEACHER`) — pendiente desde antes de esta sesión, sigue sin resolverse si los perfiles de "director de proyecto" necesitan un rol real en el dashboard clínico (hoy son solo cuentas Firebase internas del módulo de desarrollo). Ver `contexto-base-datos-postgresql-mongodb.md`.
- **Esquema de Mongo para `consultations`** (chat con IA, viñeta clínica, evaluación detallada) sigue sin implementarse — es un módulo aparte (simulación clínica con IA), no tocado en esta sesión. Ver mismo documento de contexto de base de datos.
