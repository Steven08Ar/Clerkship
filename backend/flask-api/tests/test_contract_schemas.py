"""
Pruebas de Validación de Esquemas en Tiempo de Ejecución.
Valida que las respuestas generadas por los endpoints de Flask coincidan
estrictamente con los esquemas de datos definidos en components.schemas de OpenAPI.
"""


def test_health_endpoint_conforms_to_schema(client, schema_validator):
    """Verifica que /api/health retorne HTTP 200 y cumpla con el esquema HealthResponse."""
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None, "La respuesta debe ser un objeto JSON válido"

    # Validar estructura contra el esquema HealthResponse de OpenAPI
    schema_validator(data, "HealthResponse")
    assert data.get("status") in ("healthy", "degraded")
    assert "databases" in data
    assert "service" in data


def test_unauthorized_endpoints_conform_to_contract(client):
    """Verifica que las peticiones a rutas protegidas sin JWT retornen 401 con mensaje adecuado."""
    protected_urls = [
        "/api/auth/me",
        "/api/cursos",
        "/api/articulos",
        "/api/consultas",
        "/api/historial",
        "/api/documentos/carpetas",
    ]

    for url in protected_urls:
        response = client.get(url)
        assert response.status_code == 401, f"La ruta {url} debió responder 401 Unauthorized"
        data = response.get_json()
        assert data is not None
        assert "msg" in data or "error" in data, f"La respuesta de {url} debe incluir descripción de error"


def test_not_found_endpoint_conforms_to_schema(client, schema_validator):
    """Verifica que rutas inexistentes retornen HTTP 404 cumpliendo el esquema ErrorResponse."""
    response = client.get("/api/ruta-que-no-existe-para-prueba-contrato")
    assert response.status_code == 404

    data = response.get_json()
    assert data is not None
    # Validar contra el esquema ErrorResponse definido en el contrato
    schema_validator(data, "ErrorResponse")
    assert data["status_code"] == 404
    assert data["error"] == "Not Found"


def test_method_not_allowed_conforms_to_schema(client, schema_validator):
    """Verifica que métodos no soportados retornen HTTP 405 cumpliendo el esquema ErrorResponse."""
    response = client.delete("/api/health")
    assert response.status_code == 405

    data = response.get_json()
    assert data is not None
    schema_validator(data, "ErrorResponse")
    assert data["status_code"] == 405
    assert data["error"] == "Method Not Allowed"


def test_email_status_conforms_to_contract(client, spec, schema_validator):
    """Verifica que /api/email/status cumpla el esquema documentado en OpenAPI."""
    response = client.get("/api/email/status")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None

    email_schema = spec["paths"]["/api/email/status"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    schema_validator(data, email_schema)
    assert "service" in data
    assert "mode" in data
    assert data["mode"] in ("live", "simulated")


def test_docs_openapi_json_endpoint(client):
    """Verifica que el endpoint /api/openapi.json sirva un contrato válido con todos los metadatos."""
    response = client.get("/api/openapi.json")
    assert response.status_code == 200

    spec_data = response.get_json()
    assert spec_data.get("openapi") == "3.0.3"
    assert "paths" in spec_data
    assert len(spec_data["paths"]) >= 37
    assert "components" in spec_data
    assert "schemas" in spec_data["components"]

