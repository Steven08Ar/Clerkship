"""
Unit tests for Pydantic Request and Response models in Clerkship API.
"""

from flask import Blueprint, Flask, jsonify
from pydantic import ValidationError
import pytest

from app.schemas import (
    ArticleResponse,
    AuthTokensResponse,
    ChatMessage,
    CommunityCommentResponse,
    CommunityPostResponse,
    ConsultationDetailResponse,
    ConsultationResponse,
    CourseResponse,
    CreateArticleRequest,
    CreateCommentRequest,
    CreateConsultationRequest,
    CreateCourseRequest,
    CreateFolderRequest,
    CreatePostRequest,
    DocumentFileResponse,
    DocumentFolderResponse,
    EmailNotificationResponse,
    EmailStatusResponse,
    ErrorResponse,
    FeedbackResponse,
    HealthResponse,
    LikeResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    SendNotificationRequest,
    StudentShelfItem,
    StudentStatisticsResponse,
    UpdateFolderRequest,
    UpdateShelfRequest,
    UpdateUserRequest,
    UploadDocumentRequest,
    UserResponse,
    UserSummary,
    VerifyEmailRequest,
    validate_body,
    CognitiveBias,
    DomainScores,
    EvaluateSessionRequest,
    EvaluationResultResponse,
    GenerateCaseRequest,
    GeneratedCaseResponse,
    GroundTruth,
    PatientChatRequest,
    PatientChatResponse,
    PatientDemographics,
    VitalSigns,
)


def test_error_and_health_schemas():
    """Test standard ErrorResponse and HealthResponse serialization and validation."""
    err = ErrorResponse(error="Bad Request", message="Datos inválidos", status_code=400)
    data = err.model_dump()
    assert data["status_code"] == 400
    assert data["error"] == "Bad Request"

    health = HealthResponse(
        status="healthy",
        service="Clerkship Backend API",
        framework="Flask",
        version="1.0.0",
        databases={"postgresql": "connected", "mongodb": "connected"},
    )
    assert health.databases.postgresql == "connected"
    assert health.status == "healthy"


def test_auth_register_validation():
    """Test validation constraints on RegisterRequest."""
    # Valid payload
    valid_data = {
        "role": "STUDENT",
        "first_name": "Santiago",
        "last_name": "Arias",
        "email": "sarias202@unab.edu.co",
        "password": "PasswordSeguro2026*",
        "student_code": "U00123456",
    }
    req = RegisterRequest.model_validate(valid_data)
    assert req.role == "STUDENT"
    assert req.email == "sarias202@unab.edu.co"

    # Invalid role
    with pytest.raises(ValidationError):
        RegisterRequest.model_validate({**valid_data, "role": "SUPERUSER"})

    # Password too short (< 8 chars)
    with pytest.raises(ValidationError):
        RegisterRequest.model_validate({**valid_data, "password": "short"})

    # Invalid email syntax
    with pytest.raises(ValidationError):
        RegisterRequest.model_validate({**valid_data, "email": "not-an-email"})


def test_auth_verification_and_login():
    """Test OTP code format and LoginRequest."""
    # 6 digits code passes
    verify_req = VerifyEmailRequest(email="test@unab.edu.co", code="123456")
    assert verify_req.code == "123456"

    # Non-numeric or wrong length code fails
    with pytest.raises(ValidationError):
        VerifyEmailRequest(email="test@unab.edu.co", code="12345")  # 5 digits
    with pytest.raises(ValidationError):
        VerifyEmailRequest(email="test@unab.edu.co", code="abcdef")  # letters

    # Login
    login = LoginRequest(email="test@unab.edu.co", password="secretpassword")
    assert login.email == "test@unab.edu.co"


def test_usuarios_and_storage():
    """Test UserResponse, UserSummary and StorageUsageResponse."""
    user = UserResponse(
        id="a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        username="sarias202",
        email="sarias202@unab.edu.co",
        first_name="Santiago",
        last_name="Arias",
        role="STUDENT",
        email_verified=True,
    )
    dumped = user.model_dump()
    assert dumped["username"] == "sarias202"
    assert dumped["email_verified"] is True

    update = UpdateUserRequest(first_name="Carlos")
    assert update.first_name == "Carlos"
    assert update.last_name is None


def test_cursos_schemas():
    """Test CreateCourseRequest and CourseResponse."""
    course_req = CreateCourseRequest(name="Gastroenterología", academic_period="2026-1")
    assert course_req.name == "Gastroenterología"

    with pytest.raises(ValidationError):
        CreateCourseRequest(name="")  # min_length=1

    course_res = CourseResponse(
        id="c1",
        teacher_id="t1",
        name="Gastroenterología",
        description="Módulo práctico",
        academic_period="2026-1",
    )
    assert course_res.teacher_id == "t1"


def test_articulos_and_shelf():
    """Test article creation and reading shelf item schemas."""
    article_req = CreateArticleRequest(
        title="Abdomen Agudo",
        content="Contenido de prueba",
        specialty="Gastroenterología",
        tags=["GUÍA", "CIRUGÍA"],
    )
    assert len(article_req.tags) == 2

    # Shelf update enums
    shelf = UpdateShelfRequest(status="FINISHED")
    assert shelf.status == "FINISHED"

    with pytest.raises(ValidationError):
        UpdateShelfRequest(status="IN_PROGRESS")  # Only NEXT or FINISHED


def test_documentos_and_folders():
    """Test folder colors (hex regex) and upload schemas."""
    folder = CreateFolderRequest(name="Rotación 1", color="#10B981")
    assert folder.color == "#10B981"

    # Invalid color hex
    with pytest.raises(ValidationError):
        CreateFolderRequest(name="Rotación 1", color="red")

    upload = UploadDocumentRequest(name="historia.pdf", file_base64="JVBERi0xLjcK...")
    assert upload.mime_type == "application/pdf"


def test_comunidad_schemas():
    """Test discussion posts, comments, and like toggle."""
    post = CreatePostRequest(title="Duda de caso", content="¿Cuál es la dosis inicial de omeprazol?")
    assert post.title.startswith("Duda")

    comment = CreateCommentRequest(content="Dosis estándar 40mg IV")
    assert comment.content == "Dosis estándar 40mg IV"

    like = LikeResponse(liked=True, likes_count=15)
    assert like.liked is True
    assert like.likes_count == 15


def test_consultas_and_chat():
    """Test clinical simulation and chat message schemas."""
    sim_req = CreateConsultationRequest(course_id="uuid-course", difficulty="HARD")
    assert sim_req.difficulty == "HARD"

    with pytest.raises(ValidationError):
        CreateConsultationRequest(course_id="uuid-course", difficulty="IMPOSSIBLE")

    msg = ChatMessage(sender="PATIENT", content="Tengo dolor en la boca del estómago.")
    assert msg.sender == "PATIENT"

    detail = ConsultationDetailResponse(
        id="sim-1",
        student_id="std-1",
        course_id="crs-1",
        title="Dolor epigástrico",
        specialty="Gastroenterología",
        difficulty="MEDIUM",
        status="IN_PROGRESS",
        chat_history=[msg],
        case_details={"edad": 45, "sexo": "M"},
    )
    assert len(detail.chat_history) == 1
    assert detail.case_details["edad"] == 45


def test_historial_and_feedback():
    """Test feedback rubric and statistics schemas."""
    stats = StudentStatisticsResponse(
        total_simulaciones=10,
        completadas=8,
        en_progreso=2,
        promedio_score=85.5,
        por_especialidad={"Gastroenterología": 6, "Cardiología": 4},
    )
    assert stats.completadas == 8
    assert stats.promedio_score == 85.5


def test_email_schemas():
    """Test email notification request and diagnostic status schemas."""
    email_req = SendNotificationRequest(to="docente@unab.edu.co", subject="Alerta de caso", text="Notificación")
    assert email_req.to == "docente@unab.edu.co"

    status = EmailStatusResponse(
        service="Mailgun",
        configured=True,
        mode="live",
        domain="clerk-ship.online",
        from_address="noreply@clerk-ship.online",
    )
    assert status.configured is True


def test_validate_body_decorator_in_flask():
    """Test the @validate_body decorator behavior on simulated Flask routes."""
    test_app = Flask(__name__)
    test_bp = Blueprint("test_bp", __name__)

    @test_bp.post("/test-register")
    @validate_body(RegisterRequest)
    def handle_register(validated_body: RegisterRequest):
        return (
            jsonify(
                {
                    "message": "Validado con éxito",
                    "user_id": "usr-123",
                    "email": validated_body.email,
                    "username": validated_body.first_name.lower(),
                }
            ),
            201,
        )

    test_app.register_blueprint(test_bp)
    client = test_app.test_client()

    # Case 1: Valid payload -> 201 Created
    res = client.post(
        "/test-register",
        json={
            "role": "STUDENT",
            "first_name": "Valeria",
            "last_name": "Gómez",
            "email": "vgomez@unab.edu.co",
            "password": "Password123*",
        },
    )
    assert res.status_code == 201
    assert res.get_json()["message"] == "Validado con éxito"

    # Case 2: Invalid payload (password too short) -> 400 Bad Request
    res_bad = client.post(
        "/test-register",
        json={
            "role": "STUDENT",
            "first_name": "Valeria",
            "last_name": "Gómez",
            "email": "vgomez@unab.edu.co",
            "password": "123",
        },
    )
    assert res_bad.status_code == 400
    json_bad = res_bad.get_json()
    assert json_bad["error"] == "Bad Request"
    assert "details" in json_bad
    assert any("password" in err["field"] for err in json_bad["details"])

    # Case 3: Empty body when required -> 400 Bad Request
    res_empty = client.post("/test-register", json={})
    assert res_empty.status_code == 400


def test_ai_agents_schemas():
    """Test AI Agents Request and Response schemas."""
    # Case Generator
    case_req = GenerateCaseRequest(difficulty="HARD", condition="Hemorragia")
    assert case_req.difficulty == "HARD"
    assert case_req.condition == "Hemorragia"

    demo = PatientDemographics(age=45, gender="M", occupation="Docente")
    vitals = VitalSigns(
        blood_pressure="120/80",
        heart_rate=80,
        respiratory_rate=16,
        temperature=36.8,
        oxygen_saturation=98,
    )
    gt = GroundTruth(
        definitive_diagnosis="Pancreatitis",
        key_diagnostic_tests=["Amilasa"],
        acceptable_differentials=["Colecistitis"],
        clinical_summary="Fisiopatología",
    )
    case_resp = GeneratedCaseResponse(
        case_id="C1",
        title="Caso Prueba",
        specialty="Gastro",
        difficulty="MEDIUM",
        demographics=demo,
        chief_complaint="Dolor",
        present_illness="Enfermedad actual",
        vital_signs=vitals,
        ground_truth=gt,
    )
    assert case_resp.case_id == "C1"
    assert case_resp.ground_truth.definitive_diagnosis == "Pancreatitis"

    # Virtual Patient
    chat_req = PatientChatRequest(message="¿Cómo está?")
    assert chat_req.message == "¿Cómo está?"
    with pytest.raises(ValidationError):
        PatientChatRequest(message="")

    chat_resp = PatientChatResponse(
        reply="Me siento mal",
        emotional_state="ansioso",
        pain_scale_reported=8,
        timestamp="2026-09-10T20:00:00Z",
    )
    assert chat_resp.pain_scale_reported == 8

    # Clinical Evaluator
    eval_req = EvaluateSessionRequest(final_diagnosis="Pancreatitis")
    assert eval_req.final_diagnosis == "Pancreatitis"

    scores = DomainScores(
        anamnesis=85.0,
        diagnostic_tests=90.0,
        differential_hypotheses=75.0,
        final_diagnosis=95.0,
    )
    bias = CognitiveBias(bias_name="Anclaje", detected=False)
    eval_resp = EvaluationResultResponse(
        final_score=86.5,
        domain_scores=scores,
        detected_biases=[bias],
        feedback_summary="Buen desempeño",
    )
    assert eval_resp.final_score == 86.5
    assert len(eval_resp.detected_biases) == 1

