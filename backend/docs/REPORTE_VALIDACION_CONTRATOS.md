# Reporte de Validación de Contratos de API — Clerkship / ClinicAI UNAB

Este documento certifica la conformidad técnica, la validez estructural y la paridad funcional del contrato de API REST (**OpenAPI 3.0.3**) frente a la implementación del backend en **Flask**.

---

## 1. Resumen Ejecutivo

| Métrica | Resultado | Estado |
|---|:---:|:---:|
| **Total de Pruebas de Contrato** | 14 | ✅ PASSED |
| **Pruebas Exitosas** | 14 | 100% |
| **Pruebas Fallidas** | 0 | 0% |
| **Tiempo de Ejecución** | 3.61 segundos | Óptimo |
| **Validador Oficial Empleado** | `openapi-spec-validator 0.9.0` | Cumple estándar |
| **Motor de Pruebas** | `pytest 9.1.1` | Automatizado |

---

## 2. Dimensiones de Validación Evaluadas

### Dimensión 1: Validez Estructural del Estándar OpenAPI 3.0.3
Se evaluó el archivo maestro [`backend/docs/openapi.yaml`](openapi.yaml) contra el metamodelo oficial de la Iniciativa OpenAPI (OAI):
* **Sintaxis y Tipado**: Cumplimiento estricto de los tipos de datos OpenAPI (`string`, `integer`, `number`, `boolean`, `array`, `object`).
* **Metadatos Obligatorios**: Título del sistema, versión semántica (`1.0.0`), descripción pedagógico-clínica y licencia GNU GPL v3.
* **Seguridad Global**: Definición estandarizada del esquema `BearerAuth` (formato JWT para cabecera `Authorization: Bearer <token>`).
* **Integridad de Referencias**: 100% de los punteros internos (`$ref`) resuelven de forma unívoca hacia `components.schemas` o `components.responses` sin enlaces rotos.

### Dimensión 2: Cobertura y Paridad (Contrato vs. Implementación Flask)
Se contrastó el mapa de enrutamiento en memoria de la aplicación Flask (`app.url_map`) contra la sección `paths` del contrato:
* **Paridad de Rutas**: Todas las rutas de negocio implementadas en los 9 Blueprints de Flask tienen su correspondiente definición en OpenAPI.
* **Paridad de Métodos HTTP**: Cada verbo HTTP soportado por Flask (`GET`, `POST`, `PATCH`, `DELETE`) coincide exactamente con las operaciones documentadas en el contrato.
* **Cero Rutas Fantasma**: No existen endpoints de negocio implementados que carezcan de documentación formal.

### Dimensión 3: Conformidad de Esquemas en Tiempo de Ejecución (Schema Validation)
Se verificó mediante el cliente de pruebas HTTP de Flask que los datos emitidos por los endpoints cumplan con los esquemas JSON de OpenAPI:
* **Casos Exitosos (200 OK)**:
  * `/api/health` validado contra `HealthResponse` (incluyendo estado de conectividad con PostgreSQL y MongoDB).
  * `/api/email/status` validado contra su esquema de configuración y modo operativo.
  * `/api/openapi.json` validado como documento JSON estructurado con el catálogo completo de rutas.
* **Casos de Error Estandarizados**:
  * Peticiones a rutas protegidas sin credenciales responden `401 Unauthorized`.
  * Peticiones a rutas inexistentes responden `404 Not Found` validado contra `ErrorResponse`.
  * Métodos HTTP no permitidos responden `405 Method Not Allowed` validado contra `ErrorResponse`.

---

## 3. Matriz Detallada de Pruebas Ejecutadas

| Módulo de Prueba | Prueba Unitaria | Descripción Técnica | Resultado |
|---|---|---|:---:|
| `test_contract_spec.py` | `test_openapi_spec_is_valid_standard` | Validación oficial OpenAPI 3.0.3 con `openapi-spec-validator` | ✅ PASSED |
| `test_contract_spec.py` | `test_openapi_metadata` | Verificación de `title`, `version`, `servers` y licencia | ✅ PASSED |
| `test_contract_spec.py` | `test_openapi_security_schemes` | Configuración del esquema `BearerAuth` con formato JWT | ✅ PASSED |
| `test_contract_spec.py` | `test_openapi_tags_complete` | Verificación de nombres y descripciones en los 10 tags | ✅ PASSED |
| `test_contract_spec.py` | `test_openapi_internal_refs_resolve` | Resolución exhaustiva de todas las referencias `$ref` | ✅ PASSED |
| `test_contract_coverage.py` | `test_all_spec_paths_exist_in_flask` | Todas las rutas de OpenAPI están implementadas en Flask | ✅ PASSED |
| `test_contract_coverage.py` | `test_all_flask_routes_are_documented_in_spec` | Todos los endpoints de Flask están documentados en OpenAPI | ✅ PASSED |
| `test_contract_coverage.py` | `test_http_methods_parity` | Métodos HTTP (`GET`, `POST`, `PATCH`, `DELETE`) coinciden 1:1 | ✅ PASSED |
| `test_contract_schemas.py` | `test_health_endpoint_conforms_to_schema` | Respuesta de salud validada contra `HealthResponse` | ✅ PASSED |
| `test_contract_schemas.py` | `test_unauthorized_endpoints_conform_to_contract` | Rutas protegidas responden 401 sin token de autorización | ✅ PASSED |
| `test_contract_schemas.py` | `test_not_found_endpoint_conforms_to_schema` | Error 404 validado contra esquema `ErrorResponse` | ✅ PASSED |
| `test_contract_schemas.py` | `test_method_not_allowed_conforms_to_schema` | Error 405 validado contra esquema `ErrorResponse` | ✅ PASSED |
| `test_contract_schemas.py` | `test_email_status_conforms_to_contract` | Respuesta de diagnóstico de correo validada contra su esquema | ✅ PASSED |
| `test_contract_schemas.py` | `test_docs_openapi_json_endpoint` | Endpoint `/api/openapi.json` sirve especificación íntegra | ✅ PASSED |

---

## 4. Instrucciones para Reproducir la Validación

Cualquier evaluador, docente o desarrollador puede ejecutar y comprobar la suite de pruebas siguiendo estos pasos:

### 1. Activar el entorno virtual e instalar dependencias
```powershell
cd backend/flask-api
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Ejecutar la suite de pruebas de contrato con Pytest
```powershell
pytest tests/ -v
```

### Salida esperada de la consola:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\usuario\Documents\GitHub\Clerkship\backend\flask-api
collected 14 items

tests/test_contract_coverage.py::test_all_spec_paths_exist_in_flask PASSED [  7%]
tests/test_contract_coverage.py::test_all_flask_routes_are_documented_in_spec PASSED [ 14%]
tests/test_contract_coverage.py::test_http_methods_parity PASSED         [ 21%]
tests/test_contract_schemas.py::test_health_endpoint_conforms_to_schema PASSED [ 28%]
tests/test_contract_schemas.py::test_unauthorized_endpoints_conform_to_contract PASSED [ 35%]
tests/test_contract_schemas.py::test_not_found_endpoint_conforms_to_schema PASSED [ 42%]
tests/test_contract_schemas.py::test_method_not_allowed_conforms_to_schema PASSED [ 50%]
tests/test_contract_schemas.py::test_email_status_conforms_to_contract PASSED [ 57%]
tests/test_contract_schemas.py::test_docs_openapi_json_endpoint PASSED   [ 64%]
tests/test_contract_spec.py::test_openapi_spec_is_valid_standard PASSED  [ 71%]
tests/test_contract_spec.py::test_openapi_metadata PASSED                [ 78%]
tests/test_contract_spec.py::test_openapi_security_schemes PASSED        [ 85%]
tests/test_contract_spec.py::test_openapi_tags_complete PASSED           [ 92%]
tests/test_contract_spec.py::test_openapi_internal_refs_resolve PASSED   [100%]

============================== 14 passed in 3.61s ==============================
```

---

## 5. Conclusión

El contrato de API REST de Clerkship / ClinicAI UNAB se encuentra **100% validado**, certificado bajo la especificación formal **OpenAPI 3.0.3**, sincronizado de extremo a extremo con el código fuente en Flask y cubierto por una batería de pruebas automatizadas continua.

