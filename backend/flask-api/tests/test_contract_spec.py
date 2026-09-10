"""
Pruebas de Validación Estructural del Contrato OpenAPI 3.0.3.
Certifica que el archivo openapi.yaml cumpla con el estándar oficial de OpenAPI
utilizando la herramienta oficial openapi-spec-validator.
"""
from openapi_spec_validator import validate


def test_openapi_spec_is_valid_standard(spec):
    """Certifica que el contrato cumpla al 100% el estándar oficial OpenAPI 3.0.3."""
    # Si la especificación tiene algún error de sintaxis, tipos o estructura, levantará OpenAPIValidationError
    validate(spec)


def test_openapi_metadata(spec):
    """Verifica la presencia de metadatos requeridos por la especificación."""
    assert spec.get("openapi") == "3.0.3", "La versión de OpenAPI debe ser 3.0.3"
    info = spec.get("info", {})
    assert "title" in info and len(info["title"]) > 0, "Debe tener un título definido"
    assert "version" in info and len(info["version"]) > 0, "Debe tener una versión definida"
    assert "description" in info, "Debe incluir descripción del sistema"
    assert "license" in info, "Debe incluir licencia del proyecto"

    servers = spec.get("servers", [])
    assert len(servers) > 0, "Debe definir al menos un servidor base"
    assert any("localhost" in s.get("url", "") for s in servers), "Debe incluir el servidor de desarrollo local"


def test_openapi_security_schemes(spec):
    """Verifica que el esquema de seguridad BearerAuth (JWT) esté debidamente configurado."""
    components = spec.get("components", {})
    assert "securitySchemes" in components, "Debe tener securitySchemes en components"
    sec_schemes = components["securitySchemes"]
    assert "BearerAuth" in sec_schemes, "Debe definir el esquema BearerAuth"
    bearer = sec_schemes["BearerAuth"]
    assert bearer.get("type") == "http", "El tipo de seguridad debe ser http"
    assert bearer.get("scheme") == "bearer", "El scheme debe ser bearer"
    assert bearer.get("bearerFormat") == "JWT", "El formato del bearer debe ser JWT"


def test_openapi_tags_complete(spec):
    """Verifica que los tags de agrupación funcional estén definidos con nombre y descripción."""
    tags = spec.get("tags", [])
    assert len(tags) >= 8, f"Se esperaban al menos 8 tags de módulos, encontrados {len(tags)}"
    for tag in tags:
        assert "name" in tag and len(tag["name"]) > 0, "Cada tag debe tener nombre"
        assert "description" in tag and len(tag["description"]) > 0, f"El tag {tag['name']} debe tener descripción"


def test_openapi_internal_refs_resolve(spec):
    """Verifica que todas las referencias $ref en el contrato resuelvan internamente sin enlaces rotos."""
    def _check_refs(node, path=""):
        if isinstance(node, dict):
            for k, v in node.items():
                if k == "$ref" and isinstance(v, str):
                    assert v.startswith("#/"), f"La referencia {v} en {path} debe ser local (#/)"
                    parts = v.split("/")[1:]
                    curr = spec
                    for part in parts:
                        assert part in curr, f"Referencia rota: {v} (no se encontró '{part}') en {path}"
                        curr = curr[part]
                else:
                    _check_refs(v, f"{path}.{k}")
        elif isinstance(node, list):
            for i, item in enumerate(node):
                _check_refs(item, f"{path}[{i}]")

    _check_refs(spec)

