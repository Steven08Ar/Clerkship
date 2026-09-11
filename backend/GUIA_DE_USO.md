# Plataforma clinica educativa

## Iniciar contenedores de base de datos (Docker)

```bash
# Entrar a la carpeta de docker
cd backend/docker  

# Levantar PostgreSQL y MongoDB en segundo plano
docker compose up -d  

# Detener los contenedores y remover volúmenes (cuando se requiera reiniciar de cero)
docker compose down -v  
```

### Entrar a base de datos postgres
```bash
docker exec -it medical_postgres bash    
psql -U postgres_admin -h localhost -d medical_simulator  
\l  
\c medical_simulator  
\dt  
\q  
```

### Entrar a base de datos mongo
```bash
docker exec -it medical_mongodb mongosh
show collections
```

---

## Configuración y Ejecución del Backend (Flask)

Sigue estos pasos para preparar y poner en marcha el servidor de la API:

### 1. Ubicarse en la carpeta de la API
```bash
cd backend/flask-api
```

### 2. Crear y activar el entorno virtual (`venv`)
> **Nota:** Se recomienda crear un entorno virtual para aislar las dependencias del proyecto.

* **En Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
  *(Si PowerShell restringe la ejecución de scripts, ejecuta primero: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

* **En Windows (CMD):**
  ```cmd
  python -m venv venv
  .\venv\Scripts\activate.bat
  ```

* **En Linux / macOS:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Instalar dependencias
Con el entorno virtual activado, instala las librerías necesarias:
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
Copia la plantilla de variables de entorno y crea tu archivo `.env`:

* **En Windows (PowerShell):**
  ```powershell
  Copy-Item .env.example .env
  ```
* **En Linux / macOS / Bash:**
  ```bash
  cp .env.example .env
  ```

Asegúrate de configurar en el archivo `.env`:
* `DATABASE_URL`: Cadena de conexión a PostgreSQL (remota vía Supabase o local vía Docker).
* `MONGODB_URI`: Cadena de conexión a MongoDB (remota vía Atlas o local vía Docker).
* `JWT_SECRET_KEY`: Cadena secreta para firmar tokens de autenticación.
* `CORS_ORIGINS`: Origen permitido para el frontend (por defecto `http://localhost:5173`).

> **Tip:** El archivo `.env` ya viene preparado con las líneas listas y comentadas tanto para la nube (Supabase / MongoDB Atlas) como para el entorno local con Docker. Puedes alternar fácilmente comentando/descomentando la línea deseada.

### 5. Iniciar el servidor Flask
Ejecuta el punto de entrada de la aplicación:
```bash
python app.py
```

El servidor arrancará en modo desarrollo en:
`http://127.0.0.1:5000` (o `http://localhost:5000`)

---

## Cómo Comprobar que el Backend Funcione Bien

Puedes verificar el correcto funcionamiento del backend mediante los siguientes métodos:

### Método 1: Comprobación rápida vía Navegador
Abre en tu navegador la URL del endpoint de salud:
```
http://localhost:5000/api/health
```

Deberás ver una respuesta JSON similar a:
```json
{
  "databases": {
    "mongodb": "connected",
    "postgresql": "connected"
  },
  "framework": "Flask",
  "service": "Clerkship Backend API",
  "status": "healthy",
  "version": "1.0.0"
}
```
* `status: "healthy"` indica que la API y sus conexiones a bases de datos están funcionando correctamente.
* Si alguna base de datos aún no está levantada o configurada, el endpoint responderá con `status: "degraded"` y el detalle del estado (`unconfigured` o mensaje de error), permitiendo diagnosticar rápidamente sin que el servidor se caiga.

### Método 2: Comprobación por Consola (PowerShell / Terminal)

* **Usando PowerShell:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
  ```

* **Usando curl:**
  ```bash
  curl -i http://localhost:5000/api/health
  ```

### Método 3: Comprobación del Manejador de Errores JSON
Prueba solicitar una ruta que no exista para verificar que el backend responde en formato JSON (y no con páginas HTML de error por defecto):
```bash
curl -i http://localhost:5000/api/ruta-inexistente
```
Respuesta esperada con código HTTP `404`:
```json
{
  "error": "Not Found",
  "message": "El recurso solicitado no fue encontrado.",
  "status_code": 404
}
```

### Checklist de Verificación Exitosa:
- [x] El comando `python app.py` inicia sin excepciones ni errores de importación.
- [x] La consola muestra `Running on http://127.0.0.1:5000`.
- [x] La petición a `/api/health` devuelve código `200 OK` con JSON estructurado.
- [x] Respuestas de error devuelven formato JSON estándar (`400`, `404`, `405`, `500`).
- [x] La documentación Swagger UI carga en `http://localhost:5000/api/docs` o `http://localhost:5000/docs`.

---

## Documentación Interactiva de la API (Swagger UI / OpenAPI)

El backend incorpora **Swagger UI** interactivo para explorar los 37 endpoints, consultar esquemas de datos y probar solicitudes en vivo:

### 1. Acceso a la interfaz gráfica
Con el servidor Flask encendido (`python app.py`), abre en tu navegador:
* **URL principal**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs) (o [http://localhost:5000/docs](http://localhost:5000/docs))

### 2. Cómo probar endpoints protegidos (Autenticación JWT)
1. En Swagger UI, despliega el módulo **Autenticación** y ejecuta `POST /api/auth/login` con tus credenciales.
2. Copia el valor del campo `access_token` de la respuesta.
3. Sube a la parte superior de la página y haz clic en el botón **Authorize 🔓**.
4. En el campo de texto ingresa tu token (puedes ingresarlo directamente o anteponiendo `Bearer <tu_token>`).
5. Haz clic en **Authorize** y luego en **Close**.
6. Ahora todos los endpoints que requieran autenticación (Cursos, Biblioteca, Consultas, etc.) se ejecutarán incluyendo automáticamente la cabecera `Authorization: Bearer <token>`.

### 3. Archivos del Contrato OpenAPI
Para compartir, entregar o importar en herramientas como **Postman**, **Insomnia** o **SwaggerHub**, se disponen de los siguientes archivos:
* **YAML centralizado**: [`backend/docs/openapi.yaml`](docs/openapi.yaml) (o vía web en `http://localhost:5000/api/openapi.yaml`)
* **JSON exportable**: [`backend/docs/openapi.json`](docs/openapi.json) (o vía web en `http://localhost:5000/api/openapi.json`)

---

## Validación de Contratos de API (Pytest + OpenAPI Validator)

El proyecto cuenta con una suite completa de pruebas automatizadas para verificar que la implementación en Flask y la especificación OpenAPI 3.0.3 coincidan al 100%:

### 1. Ejecutar todas las pruebas de contrato
Con el entorno virtual activado en `backend/flask-api/`, ejecuta:
```powershell
pytest tests/ -v
```

### 2. Qué valida la suite:
* **`test_contract_spec.py`**: Valida formalmente el estándar OpenAPI 3.0.3 con `openapi-spec-validator` y la integridad de referencias `$ref`.
* **`test_contract_coverage.py`**: Comprueba la paridad 1:1 entre las rutas implementadas en Flask y las documentadas en OpenAPI.
* **`test_contract_schemas.py`**: Verifica que las respuestas de los endpoints en ejecución respeten los esquemas de `components.schemas` (casos de éxito, error 401, error 404 y 405).

### 3. Reporte de Validación
El informe técnico detallado de resultados y métricas se encuentra disponible en:
📄 [`backend/docs/REPORTE_VALIDACION_CONTRATOS.md`](docs/REPORTE_VALIDACION_CONTRATOS.md)

---

## Modelos Request/Response en Python (Pydantic v2)

El backend incorpora una capa de transferencia y validación de datos (**DTOs**) en `app/schemas/` construida con **Pydantic v2** y **email-validator**. Esta capa desacopla los modelos de base de datos (`app/models/`) de las entradas y salidas de la API, garantizando contratos estrictos de tipo.

### 1. Organización del paquete `app/schemas/`:
* **`base.py`**: `BaseSchema`, `ErrorResponse`, `HealthResponse` y el decorador de ruta `@validate_body(Schema)`.
* **`auth.py`**: `RegisterRequest`, `LoginRequest`, `VerifyEmailRequest`, `AuthTokensResponse`, etc.
* **`usuarios.py`**: `UserResponse`, `UserSummary`, `UpdateUserRequest`, `StorageUsageResponse`.
* **`cursos.py`**: `CreateCourseRequest`, `CourseResponse`, `EnrollmentResponse`.
* **`articulos.py`**: `CreateArticleRequest`, `ArticleResponse`, `UpdateShelfRequest`, `StudentShelfItem`.
* **`documentos.py`**: `CreateFolderRequest`, `UploadDocumentRequest`, `DocumentFolderResponse`, etc.
* **`comunidad.py`**: `CreatePostRequest`, `CreateCommentRequest`, `CommunityPostResponse`, `LikeResponse`.
* **`consultas.py`**: `CreateConsultationRequest`, `SendMessageRequest`, `ConsultationDetailResponse`, etc.
* **`historial.py`**: `AiEvaluationSummary`, `FeedbackResponse`, `StudentStatisticsResponse`.
* **`email.py`**: `SendNotificationRequest`, `EmailStatusResponse`, `EmailNotificationResponse`.

### 2. Cómo usar el decorador `@validate_body`:
```python
from flask import Blueprint, jsonify
from app.schemas import RegisterRequest, validate_body

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
@validate_body(RegisterRequest)
def register(validated_body: RegisterRequest):
    # validated_body es una instancia tipada de RegisterRequest con datos 100% validados
    email = validated_body.email
    password = validated_body.password
    ...
```

### 3. Ejecución de pruebas unitarias de modelos:
Para ejecutar exclusivamente las pruebas de validación de modelos Pydantic:
```powershell
pytest tests/test_schemas.py -v
```
O para correr la suite completa (contratos + esquemas + endpoints):
```powershell
pytest tests/ -v
```

---

## Estructura de Endpoints y Pruebas de Integración

Todos los Blueprints del backend implementan una estructura consistente:
1. **Validación Automática**: Los endpoints que mutan estado (`POST`, `PATCH`) utilizan `@validate_body(Schema)` para interceptar errores de validación y retornar `400 Bad Request` con el arreglo `"details"`.
2. **Seguridad y Roles (RBAC)**: Endpoints protegidos aplican `@jwt_required()` y los endpoints con privilegios específicos aplican `@role_required("TEACHER")` o `@role_required("STUDENT")`.
3. **Códigos de Estado Homogéneos**:
   - `200 OK`: Consultas exitosas y actualizaciones.
   - `201 Created`: Recursos creados (usuarios, cursos, carpetas, publicaciones, consultas).
   - `400 Bad Request`: Datos de solicitud inválidos o malformados.
   - `401 Unauthorized`: Token JWT ausente o inválido.
   - `403 Forbidden`: Rol insuficiente para realizar la acción.
   - `404 Not Found`: Recurso no encontrado.
   - `409 Conflict`: Conflictos de unicidad (correo duplicado, auto-matrícula repetida).

### Ejecutar pruebas de estructura e integración de endpoints:
```powershell
pytest tests/test_endpoints_structure.py -v
```

---

## Endpoints Mock para los Agentes de IA (ClinicAI UNAB)

El backend expone 3 endpoints especializados bajo el prefijo `/api/agentes` para dar soporte al simulador clínico mediante los tres agentes pedagógicos:

### 1. Agente 1: Generador de Casos Clínicos (`POST /api/agentes/caso`)
Genera una viñeta clínica estructurada en Gastroenterología con perfil demográfico, signos vitales basales, motivo de consulta, enfermedad actual, antecedentes, examen físico y estándar de referencia *Ground Truth*.

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:5000/api/agentes/caso \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "specialty": "Gastroenterología",
    "difficulty": "MEDIUM",
    "condition": "Pancreatitis Aguda"
  }'
```

### 2. Agente 2: Paciente Virtual Estandarizado (`POST /api/agentes/paciente/chat`)
Interroga al paciente virtual durante la anamnesis recibiendo respuestas coherentes en lenguaje natural coloquial, con estado afectivo y escala de dolor reportada.

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:5000/api/agentes/paciente/chat \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-GI-001",
    "message": "¿En qué parte siente el dolor y hacia dónde se irradia?"
  }'
```

### 3. Agente 3: Tutor Evaluador de Razonamiento Clínico (`POST /api/agentes/evaluar`)
Evalúa la sesión completa contra el *Ground Truth*, calcula puntajes cuantitativos por 4 dominios (0 a 100), detecta sesgos cognitivos (*Anclaje*, *Cierre Prematuro*, *Confirmación*) según la Teoría de Procesamiento Dual y emite retroalimentación formativa.

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:5000/api/agentes/evaluar \
  -H "Authorization: Bearer <TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-GI-001",
    "chat_history": [
      {"sender": "doctor", "message": "¿Dónde le duele y desde cuándo?"},
      {"sender": "patient", "message": "En la boca del estómago desde anoche."},
      {"sender": "doctor", "message": "¿Ha tenido vómitos?"},
      {"sender": "patient", "message": "Sí, 5 vómitos amargos."}
    ],
    "requested_tests": ["Lipasa sérica", "Ecografía hepatobiliar"],
    "differential_diagnoses": ["Colecistitis aguda", "Úlcera péptica"],
    "final_diagnosis": "Pancreatitis aguda litiásica"
  }'
```

### 4. Ejecución de Pruebas Automatizadas de los Agentes
Para ejecutar exclusivamente la suite de pruebas unitarias e integración de los agentes:
```powershell
pytest tests/test_ai_agents.py -v
```

Para ejecutar toda la suite de pruebas del backend (50 pruebas pasando al 100%):
```powershell
pytest tests/ -v
```

### 5. Configuración Futura para Modelos Comerciales (OpenAI / Gemini)
El sistema utiliza el patrón Adapter desacoplado (`BaseAgentProvider`). Actualmente opera con el proveedor `mock` de alta fidelidad. Cuando se configuren las credenciales en `.env`:
```env
# Proveedor activo: mock | gemini | openai
AI_AGENT_PROVIDER=mock
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
```
El factory `app.services.agents.get_*_agent()` instanciará los clientes de OpenAI o Gemini de forma transparente sin alterar rutas, contratos ni frontend.