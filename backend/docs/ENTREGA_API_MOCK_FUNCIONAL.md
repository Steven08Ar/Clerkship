# Entrega de API Mock Funcional — Clerkship / ClinicAI UNAB

Este documento certifica la implementación, siembra de datos clínicos de prueba y verificación funcional al 100% de la **API Mock de ClinicAI UNAB / Clerkship**. La API se encuentra plenamente operativa, conectada a la base de datos PostgreSQL en la nube (Supabase), tolerante a la conectividad de MongoDB y validada exhaustivamente mediante pruebas funcionales de extremo a extremo (E2E).

---

## 1. Resumen Ejecutivo de la Entrega

| Dimensión | Métrica / Estado | Observaciones |
|---|:---:|---|
| **Módulos de Negocio Operativos** | **11 / 11** | 100% de los módulos de la plataforma funcionales |
| **Pruebas Funcionales E2E** | **10 / 10 PASSED** | `tests/test_mock_api_functional.py` |
| **Suite Total de Pruebas Pytest** | **60 / 60 PASSED** | Cero regresiones en contratos, esquemas y rutas |
| **Base de Datos Principal** | **PostgreSQL (Supabase)** | Esquema relacional activo con tablas y ENUMs |
| **Base de Datos NoSQL** | **MongoDB Atlas / Local** | Fallback seguro implementado para operaciones offline |
| **Siembra de Datos (Seeder)** | **Comando CLI Integrado** | `flask seed-mock` / `python seed_mock_data.py` |
| **Documentación Interactiva** | **Swagger UI / OpenAPI** | Disponible en `/docs` y `/api/openapi.json` |

---

## 2. Credenciales y Usuarios Pre-sembrados

La base de datos cuenta con usuarios pre-configurados para los tres roles del sistema (`STUDENT`, `TEACHER`, `ADMIN`), con correos institucionales de la UNAB verificados (`email_verified = true`) y avatares SVG clínicos:

| Rol | Nombre Completo | Correo Institucional | Contraseña | Semestre / Departamento |
|---|---|---|---|---|
| **Estudiante** | Santiago Steven Arias | `sarias202@unab.edu.co` | `Estudiante2026*` | Semestre 8 (Internado Rotatorio) |
| **Estudiante** | Valentina Gómez | `vgomez@unab.edu.co` | `Estudiante2026*` | Semestre 7 (Clínica Médica) |
| **Estudiante** | Estudiante Prueba UNAB | `estudiante@unab.edu.co` | `Estudiante2026*` | Semestre 6 (Semiología Médica) |
| **Docente** | Dr. Carlos Peña | `cpena@unab.edu.co` | `Docente2026*` | Cirugía General y Simulación |
| **Docente** | Dra. Mariana Morales | `docente@unab.edu.co` | `Docente2026*` | Medicina Interna y Gastroenterología |
| **Administrador** | Administrador del Sistema | `admin@unab.edu.co` | `Admin2026*` | Dirección Académica UNAB |

---

## 3. Cobertura y Funcionalidad de los 11 Módulos

### 1. Autenticación y Autorización JWT (`/api/auth`)
- **Login (`POST /login`)**: Emite `access_token` (formato JWT de 1 hora) y `refresh_token` (30 días), inyectando el rol del usuario en los claims adicionales.
- **Perfil Actual (`GET /me`)**: Retorna el objeto unificado de usuario con atributos específicos según el rol (`semester` para estudiantes, `department` para docentes).
- **Renovación de Token (`POST /refresh`)**: Genera nuevos tokens de acceso utilizando el `refresh_token`.
- **Cambio de Contraseña y Avatar**: Actualización de contraseñas con hash `scrypt/pbkdf2` y almacenamiento de avatares en formato SVG estructurado.

### 2. Gestión de Usuarios y Perfiles (`/api/usuarios`)
- **Búsqueda Autocompletable (`GET /buscar?q=...`)**: Filtra médicos docentes o pares académicos por nombre, apellido o nombre de usuario.
- **Detalle de Usuario (`GET /<id>`)**: Perfil público de estudiantes o docentes.
- **Cuota de Almacenamiento (`GET /uso-almacenamiento`)**: Cálculo de bytes utilizados por el estudiante con cuota máxima asignada (5 GB) y tolerancia a desconexión de MongoDB.

### 3. Cursos Clínicos y Matrículas (`/api/cursos`)
- **Catálogo de Cursos (`GET /`)**: Listado de asignaturas clínicas disponibles (e.g., *Medicina Interna: Patología Gastrointestinal*, *Cirugía General: Abdomen Agudo*).
- **Cursos Matriculados (`GET /mios`)**: Asignaturas activas del estudiante autenticado.
- **Matrícula y Desmatriculación (`POST|DELETE /<id>/matricular`)**: Gestión de inscripciones del estudiante.
- **Creación de Cursos (`POST /`)**: Exclusivo para docentes (`@role_required("TEACHER")`), permitiendo estructurar nuevas cohortes y periodos académicos.

### 4. Biblioteca Médica y Estante Personal (`/api/articulos`)
- **Catálogo de Evidencia (`GET /`)**: Guías de práctica clínica, protocolos y revisiones (e.g., *Criterios de Atlanta para Pancreatitis*, *Criterios de Tokio para Colecistitis*, *Consenso de Hemorragia Digestiva Alta*).
- **Filtros por Especialidad y Categoría (`GET /?specialty=Gastroenterología`)**: Búsqueda filtrada de recursos bibliográficos.
- **Estante Personal de Lectura (`GET /estante`)**: Seguimiento pedagógico del estudiante con estados `NEXT` (pendiente de lectura) o `FINISHED` (revisado).
- **Guardar / Eliminar del Estante (`POST|DELETE /<id>/estante`)**: Permite a los estudiantes organizar su literatura médica.

### 5. Documentos Clínicos y Carpetas (`/api/documentos`)
- **Gestión de Carpetas (`GET /carpetas`, `POST /carpetas`, `PATCH /carpetas/<id>`, `DELETE /carpetas/<id>`)**: Organización modular con nombres y colores hexadecimales (e.g., *Rotación Urgencias*, *Seminarios Clínicos*).
- Resiliencia implementada: las rutas continúan respondiendo correctamente si la colección NoSQL de documentos físicos opera de forma asíncrona.

### 6. Comunidad y Discusión Médica (`/api/comunidad`)
- **Muro de Publicaciones (`GET /posts`, `POST /posts`, `DELETE /posts/<id>`)**: Hilos de discusión clínica entre estudiantes y profesores.
- **Comentarios y Retroalimentación (`GET|POST /posts/<id>/comentarios`)**: Respuestas académicas de docentes a casos planteados por estudiantes.
- **Interacción Social (`POST /posts/<id>/like`)**: Toggle de likes en tiempo real.

### 7. Simulación Clínica y Paciente Virtual (`/api/consultas`)
- **Crear Consulta (`POST /`)**: Inicializa un encuentro clínico simulado vinculado a un curso y especialidad con estado `IN_PROGRESS`.
- **Transcripción y Detalle (`GET /<id>`)**: Historial de la anamnesis con mensajes entre el médico interno y el paciente.
- **Interrogatorio en Vivo (`POST /<id>/mensajes`)**: El estudiante envía preguntas y el **Agente 2 (Paciente Virtual)** responde con lenguaje natural coherente con su cuadro fisiopatológico y dolor.
- **Finalización de Consulta (`PATCH /<id>/finalizar`)**: El estudiante emite su diagnóstico definitivo y la consulta pasa a estado `COMPLETED`.

### 8. Historial y Evaluación de Razonamiento Clínico (`/api/historial`)
- **Consultas Realizadas (`GET /`)**: Historial de simulaciones finalizadas del estudiante.
- **Rúbrica Formativa Detallada (`GET /<id>/retroalimentacion`)**: Desglose cuantitativo por dominios (Anamnesis, Paraclínicos, Diagnósticos Diferenciales, Diagnóstico Definitivo), fortalezas, áreas de mejora y contraste directo contra el estándar de oro (*Ground Truth*).
- **Estadísticas de Desempeño (`GET /estadisticas`)**: Promedios globales de puntaje, total de consultas completadas y distribución por especialidad médica.

### 9. Agentes de IA Cognitiva (`/api/agentes`)
Tres agentes especializados fundamentados en la Teoría del Procesamiento Dual (Sistema 1 Heurístico vs. Sistema 2 Analítico):
- **Agente 1 — Generador de Casos (`POST /caso`)**: Produce viñetas clínicas completas con motivo de consulta, enfermedad actual, signos vitales y estándar de referencia ground truth.
- **Agente 2 — Paciente Virtual Estandarizado (`POST /paciente/chat`)**: Simula las respuestas del paciente, nivel de dolor reportado y modulación afectiva.
- **Agente 3 — Tutor Evaluador de Razonamiento Clínico (`POST /evaluar`)**: Compara la anamnesis, los paraclínicos solicitados y los diagnósticos planteados contra el Ground Truth, calcula puntajes ponderados y detecta sesgos cognitivos (*Sesgo de Anclaje*, *Cierre Prematuro*, *Sesgo de Confirmación*).

### 10. Diagnóstico y Correo Electrónico (`/api/email`)
- **Estado del Servicio (`GET /status`)**: Verifica la operatividad de Mailgun / emisor SMTP.
- **Envío de Notificaciones (`POST /notificar`)**: Despacho de notificaciones diagnósticas y resúmenes de evaluación.

### 11. Documentación Interactiva y OpenAPI
- **Especificación OpenAPI 3.0.3 (`GET /api/openapi.json`)**: Esquema completo en formato JSON estándar.
- **Swagger UI Interactivo (`GET /docs`)**: Interfaz web interactiva en tiempo real para explorar, probar y validar cada uno de los endpoints con autenticación Bearer JWT.

---

## 4. Instrucciones para la Siembra de Datos (Seeder)

El script de siembra rellena de forma idempotente (sin duplicar registros existentes) todas las entidades necesarias para operar la plataforma.

### Opción A: A través de Flask CLI (Recomendada)
```powershell
cd c:\Users\usuario\Documents\GitHub\Clerkship\backend\flask-api
.\venv\Scripts\python.exe -m flask seed-mock
```

### Opción B: Ejecución directa del script
```powershell
cd c:\Users\usuario\Documents\GitHub\Clerkship\backend\flask-api
.\venv\Scripts\python.exe seed_mock_data.py
```

---

## 5. Ejecución y Validación de Pruebas Automatizadas

Se dispone de una suite completa de pruebas funcionales end-to-end que comprueba automáticamente el ciclo de vida de los 11 módulos utilizando las credenciales pre-sembradas.

### Ejecutar únicamente la suite funcional de la API Mock (10 pruebas E2E):
```powershell
cd c:\Users\usuario\Documents\GitHub\Clerkship\backend\flask-api
.\venv\Scripts\pytest tests/test_mock_api_functional.py -v
```
**Resultado esperado:**
```text
tests/test_mock_api_functional.py::test_auth_login_and_me_flow PASSED            [ 10%]
tests/test_mock_api_functional.py::test_usuarios_search_and_storage PASSED       [ 20%]
tests/test_mock_api_functional.py::test_cursos_listing_and_enrollment PASSED     [ 30%]
tests/test_mock_api_functional.py::test_articulos_and_shelf_lifecycle PASSED     [ 40%]
tests/test_mock_api_functional.py::test_documentos_carpetas_crud PASSED          [ 50%]
tests/test_mock_api_functional.py::test_comunidad_posts_and_comments PASSED     [ 60%]
tests/test_mock_api_functional.py::test_simulacion_clinica_flow PASSED           [ 70%]
tests/test_mock_api_functional.py::test_historial_and_evaluation_metrics PASSED [ 80%]
tests/test_mock_api_functional.py::test_agentes_api_complete_lifecycle PASSED    [ 90%]
tests/test_mock_api_functional.py::test_email_and_documentation_endpoints PASSED [100%]
============================== 10 passed in ~28s ==============================
```

### Ejecutar la suite completa de pruebas del repositorio (60 pruebas):
```powershell
cd c:\Users\usuario\Documents\GitHub\Clerkship\backend\flask-api
.\venv\Scripts\pytest tests/ -v
```
**Resultado esperado:**
```text
============================== 60 passed in ~30s ==============================
```

---

## 6. Ejemplos de Peticiones HTTP (`cURL`)

A continuación se presentan ejemplos listos para copiar y pegar para interactuar con la API en entorno local:

### 1. Iniciar Sesión como Estudiante
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarias202@unab.edu.co",
    "password": "Estudiante2026*"
  }'
```

### 2. Consultar Artículos Médicos de Gastroenterología
```bash
curl -X GET "http://localhost:5000/api/articulos?specialty=Gastroenterolog%C3%ADa" \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>"
```

### 3. Iniciar una Simulación Clínica
```bash
curl -X POST http://localhost:5000/api/consultas \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "<COURSE_UUID>",
    "title": "Simulación: Pancreatitis Aguda",
    "specialty": "Gastroenterología",
    "difficulty": "MEDIUM"
  }'
```

### 4. Interrogar al Paciente Virtual
```bash
curl -X POST http://localhost:5000/api/consultas/<CONSULTA_UUID>/mensajes \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "¿El dolor se le transmite hacia la espalda en forma de cinturón?"
  }'
```

### 5. Evaluar Razonamiento Clínico con el Agente 3
```bash
curl -X POST http://localhost:5000/api/agentes/evaluar \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-GI-001",
    "chat_history": [
      {"sender": "doctor", "message": "¿Dónde le duele exactamente y cuándo inició?"},
      {"sender": "patient", "message": "En la boca del estómago y se me pasa a la espalda."}
    ],
    "requested_tests": ["Lipasa sérica", "Ecografía abdominal"],
    "differential_diagnoses": ["Colecistitis aguda"],
    "final_diagnosis": "Pancreatitis aguda de origen litiásico"
  }'
```

