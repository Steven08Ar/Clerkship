"""
Deterministic Mock Data Seeder for ClinicAI UNAB / Clerkship API.

Populates the database with a complete, clinically cohesive mock dataset:
- Students and Teachers with pre-configured credentials
- Clinical Courses with active student enrollments
- Medical Library Articles and clinical practice guidelines with tags and shelf items
- Document folders and storage breakdown
- Community discussion posts, comments, and likes
- Simulated clinical consultations with virtual patient chat transcripts
- AI Reasoning evaluations with formative rubrics and scores
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import uuid
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models import (
    AiEvaluation,
    Article,
    ArticleTag,
    CommunityComment,
    CommunityLike,
    CommunityPost,
    Consultation,
    Course,
    DocumentFolder,
    Student,
    StudentCourse,
    StudentLibrary,
    Teacher,
    User,
)


def seed_mock_data(verbose=True):
    """Seed or update mock data in the active database."""
    app = create_app()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    with app.app_context():
        if verbose:
            print("[*] Iniciando siembra de datos mock para ClinicAI UNAB...")

        # ---------------------------------------------------------------------
        # 1. USUARIOS Y ROLES (Estudiantes y Docentes)
        # ---------------------------------------------------------------------
        # Contraseñas estandarizadas para el entorno de pruebas
        student_password_hash = generate_password_hash("Estudiante2026*")
        teacher_password_hash = generate_password_hash("Docente2026*")
        admin_password_hash = generate_password_hash("Admin2026*")

        # Usuarios mock requeridos
        users_data = [
            {
                "email": "sarias202@unab.edu.co",
                "username": "sarias202",
                "first_name": "Santiago Steven",
                "last_name": "Arias Estupiñan",
                "role": "STUDENT",
                "password_hash": student_password_hash,
                "student_code": "U00123456",
                "semester": 7,
            },
            {
                "email": "estudiante@unab.edu.co",
                "username": "estudiante",
                "first_name": "Estudiante",
                "last_name": "Prueba",
                "role": "STUDENT",
                "password_hash": student_password_hash,
                "student_code": "U00234567",
                "semester": 6,
            },
            {
                "email": "vgomez@unab.edu.co",
                "username": "vgomez",
                "first_name": "Valeria",
                "last_name": "Gómez Rincón",
                "role": "STUDENT",
                "password_hash": student_password_hash,
                "student_code": "U00345678",
                "semester": 8,
            },
            {
                "email": "docente@unab.edu.co",
                "username": "docente",
                "first_name": "Ricardo",
                "last_name": "Morales Delgado",
                "role": "TEACHER",
                "password_hash": teacher_password_hash,
                "department": "Medicina Interna y Gastroenterología",
            },
            {
                "email": "cpena@unab.edu.co",
                "username": "cpena",
                "first_name": "Claudia",
                "last_name": "Peña Serrano",
                "role": "TEACHER",
                "password_hash": teacher_password_hash,
                "department": "Cirugía General",
            },
            {
                "email": "admin@unab.edu.co",
                "username": "admin",
                "first_name": "Administrador",
                "last_name": "ClinicAI",
                "role": "TEACHER",
                "password_hash": admin_password_hash,
                "department": "Dirección de Escuela de Medicina",
            },
        ]

        users_by_email = {}

        for udata in users_data:
            user = User.query.filter_by(email=udata["email"]).first()
            if not user:
                # Verificar username libre
                username = udata["username"]
                if User.query.filter_by(username=username).first():
                    username = f"{username}_{uuid.uuid4().hex[:4]}"

                user = User(
                    username=username,
                    first_name=udata["first_name"],
                    last_name=udata["last_name"],
                    email=udata["email"],
                    password_hash=udata["password_hash"],
                    role=udata["role"],
                    email_verified=True,
                )
                db.session.add(user)
                db.session.flush()
                if verbose:
                    print(f"  [+] Creado usuario {user.email} ({user.role})")
            else:
                user.password_hash = udata["password_hash"]
                user.first_name = udata["first_name"]
                user.last_name = udata["last_name"]
                user.email_verified = True
                db.session.flush()
                if verbose:
                    print(f"  [~] Actualizado usuario {user.email}")

            users_by_email[udata["email"]] = user

            # Asignar registro de rol respectivo
            if udata["role"] == "STUDENT":
                student_rec = Student.query.filter_by(user_id=user.id).first()
                if not student_rec:
                    student_rec = Student(
                        user_id=user.id,
                        student_code=udata["student_code"],
                        semester=udata["semester"],
                    )
                    db.session.add(student_rec)
            elif udata["role"] == "TEACHER":
                teacher_rec = Teacher.query.filter_by(user_id=user.id).first()
                if not teacher_rec:
                    teacher_rec = Teacher(
                        user_id=user.id,
                        department=udata.get("department", "Medicina"),
                    )
                    db.session.add(teacher_rec)

        db.session.commit()

        student_santiago = users_by_email["sarias202@unab.edu.co"]
        student_prueba = users_by_email["estudiante@unab.edu.co"]
        teacher_morales = users_by_email["docente@unab.edu.co"]
        teacher_pena = users_by_email["cpena@unab.edu.co"]

        # ---------------------------------------------------------------------
        # 2. CURSOS CLÍNICOS
        # ---------------------------------------------------------------------
        courses_data = [
            {
                "name": "Semiología y Razonamiento Diagnóstico I",
                "description": "Entrenamiento formativo en anamnesis estructurada y examen físico orientado por problemas.",
                "academic_period": "2026-1",
                "teacher_id": teacher_morales.id,
            },
            {
                "name": "Medicina Interna: Patología Gastrointestinal",
                "description": "Abordaje diagnóstico y toma de decisiones clínicas en patologías agudas y crónicas del tracto digestivo.",
                "academic_period": "2026-1",
                "teacher_id": teacher_morales.id,
            },
            {
                "name": "Urgencias Quirúrgicas y Abdomen Agudo",
                "description": "Identificación temprana del abdomen quirúrgico, peritonismo y conducta en el servicio de urgencias.",
                "academic_period": "2026-1",
                "teacher_id": teacher_pena.id,
            },
        ]

        seeded_courses = []
        for cdata in courses_data:
            course = Course.query.filter_by(name=cdata["name"]).first()
            if not course:
                course = Course(
                    teacher_id=cdata["teacher_id"],
                    name=cdata["name"],
                    description=cdata["description"],
                    academic_period=cdata["academic_period"],
                )
                db.session.add(course)
                db.session.flush()
                if verbose:
                    print(f"  [+] Creado curso '{course.name}'")
            seeded_courses.append(course)

        db.session.commit()

        # ---------------------------------------------------------------------
        # 3. MATRÍCULAS DE ESTUDIANTES EN CURSOS
        # ---------------------------------------------------------------------
        for course in seeded_courses[:2]:
            for student in (student_santiago, student_prueba):
                enrollment = StudentCourse.query.filter_by(student_id=student.id, course_id=course.id).first()
                if not enrollment:
                    db.session.add(StudentCourse(student_id=student.id, course_id=course.id))

        db.session.commit()
        if verbose:
            print("  [+] Matrículas registradas para estudiantes de prueba")

        # ---------------------------------------------------------------------
        # 4. BIBLIOTECA MÉDICA Y ARTÍCULOS CLÍNICOS
        # ---------------------------------------------------------------------
        articles_data = [
            {
                "type": "GUIA",
                "title": "Guía Práctica de Diagnóstico y Manejo de Pancreatitis Aguda",
                "authors": "Asociación Colombiana de Gastroenterología",
                "category": "Urgencias Médicas",
                "specialty": "Gastroenterología",
                "source": "Revista Colombiana de Gastroenterología",
                "year": 2024,
                "pages": 24,
                "description": "Criterios de Atlanta revisados, estratificación temprana con escala BISAP y fluidoterapia guiada por metas.",
                "url": "/library/guia-pancreatitis-aguda",
                "created_by": teacher_morales.id,
                "tags": ["GASTRO", "URGENCIAS", "ATLANTA", "LIPASA"],
            },
            {
                "type": "PROTOCOLO",
                "title": "Protocolo de Abordaje del Dolor en Fosa Ilíaca Derecha y Apendicitis Aguda",
                "authors": "Sociedad Colombiana de Cirugía",
                "category": "Cirugía General",
                "specialty": "Cirugía General",
                "source": "Guías de Práctica Clínica Cirugía UNAB",
                "year": 2023,
                "pages": 18,
                "description": "Puntaje de Alvarado, cronología de Murphy, signos peritoneales cardinales y criterios imagenológicos en urgencias.",
                "url": "/library/protocolo-apendicitis-aguda",
                "created_by": teacher_pena.id,
                "tags": ["CIRUGIA", "URGENCIAS", "SEMIOLOGIA", "ALVARADO"],
            },
            {
                "type": "ENSAYO",
                "title": "Consenso Nacional de Hemorragia de Vías Digestivas Altas No Variceal",
                "authors": "Colegio Médico Colombiano de Gastroenterología",
                "category": "Cuidados Críticos",
                "specialty": "Gastroenterología",
                "source": "Acta Médica Colombiana",
                "year": 2025,
                "pages": 32,
                "description": "Manejo hemodinámico inicial en shock hipovolémico, IBP en infusión y tiempos óptimos para EDA diagnóstica/terapéutica.",
                "url": "/library/consenso-hda-no-variceal",
                "created_by": teacher_morales.id,
                "tags": ["GASTRO", "HEMODINAMIA", "ENDOSCOPIA", "AINES"],
            },
            {
                "type": "GUIA",
                "title": "Criterios de Tokio 2018 para Colecistitis Aguda y Colangitis",
                "authors": "Tokyo Guidelines TG18 Consortium / Traducción Clínica UNAB",
                "category": "Cirugía Hepato-Biliar",
                "specialty": "Gastroenterología",
                "source": "Journal of Hepato-Biliary-Pancreatic Sciences",
                "year": 2022,
                "pages": 28,
                "description": "Criterios diagnósticos, clasificación de severidad grado I-III y conducta quirúrgica laparoscópica temprana.",
                "url": "/library/guias-tokio-colecistitis",
                "created_by": teacher_pena.id,
                "tags": ["CIRUGIA", "ECOGRAFIA", "BILIAR", "MURPHY"],
            },
        ]

        seeded_articles = []
        for adata in articles_data:
            art = Article.query.filter_by(title=adata["title"]).first()
            if not art:
                art = Article(
                    type=adata["type"],
                    title=adata["title"],
                    authors=adata["authors"],
                    category=adata["category"],
                    specialty=adata["specialty"],
                    source=adata["source"],
                    year=adata["year"],
                    pages=adata["pages"],
                    description=adata["description"],
                    url=adata["url"],
                    created_by=adata["created_by"],
                )
                db.session.add(art)
                db.session.flush()

                for tag_str in adata["tags"]:
                    db.session.add(ArticleTag(article_id=art.id, tag=tag_str))

                if verbose:
                    print(f"  [+] Creado artículo '{art.title}'")
            seeded_articles.append(art)

        db.session.commit()

        # Estante personal de lectura del estudiante
        if seeded_articles:
            entry1 = StudentLibrary.query.filter_by(student_id=student_santiago.id, article_id=seeded_articles[0].id).first()
            if not entry1:
                db.session.add(StudentLibrary(student_id=student_santiago.id, article_id=seeded_articles[0].id, status="FINISHED"))

            if len(seeded_articles) > 1:
                entry2 = StudentLibrary.query.filter_by(student_id=student_santiago.id, article_id=seeded_articles[1].id).first()
                if not entry2:
                    db.session.add(StudentLibrary(student_id=student_santiago.id, article_id=seeded_articles[1].id, status="NEXT"))

            db.session.commit()
            if verbose:
                print("  [+] Estante de lectura configurado para estudiante")

        # ---------------------------------------------------------------------
        # 5. CARPETAS DE DOCUMENTOS CLÍNICOS
        # ---------------------------------------------------------------------
        folders_data = [
            {"name": "Rotación Gastroenterología FOSCAL", "color": "#10B981"},
            {"name": "Guías de Práctica Clínica 2026", "color": "#3B82F6"},
            {"name": "Casos Clínicos de Razonamiento", "color": "#F59E0B"},
        ]

        for fdata in folders_data:
            f = DocumentFolder.query.filter_by(owner_user_id=student_santiago.id, name=fdata["name"]).first()
            if not f:
                db.session.add(DocumentFolder(
                    owner_user_id=student_santiago.id,
                    name=fdata["name"],
                    color=fdata["color"],
                ))
        db.session.commit()
        if verbose:
            print("  [+] Carpetas de documentos creadas")

        # ---------------------------------------------------------------------
        # 6. COMUNIDAD: PUBLICACIONES, COMENTARIOS Y VALORACIONES
        # ---------------------------------------------------------------------
        post1 = CommunityPost.query.filter_by(author_id=student_santiago.id).first()
        if not post1:
            post1 = CommunityPost(
                author_id=student_santiago.id,
                content=(
                    "Colegas, en el último caso de pancreatitis aguda con dolor transfictivo en hemicinturón, "
                    "¿en qué momento consideran mandatoria la TAC de abdomen contrastada si las enzimas pancreáticas "
                    "(lipasa y amilasa) ya están elevadas más de 3 veces el límite superior?"
                ),
            )
            db.session.add(post1)
            db.session.flush()

            # Comentario del docente
            c1 = CommunityComment(
                post_id=post1.id,
                author_id=teacher_morales.id,
                content=(
                    "Excelente pregunta Santiago. La TAC temprana (<72h) suele subestimar la necrosis peripancreática "
                    "y solo se indica si hay duda diagnóstica o deterioro hemodinámico precoz. El control estándar "
                    "se realiza entre las 72 y 96 horas si no hay respuesta a la fluidoterapia."
                ),
            )
            db.session.add(c1)

            # Like de otro estudiante
            db.session.add(CommunityLike(post_id=post1.id, user_id=student_prueba.id))
            db.session.commit()
            if verbose:
                print("  [+] Publicación y discusión clínica creada en Comunidad")

        # ---------------------------------------------------------------------
        # 7. CONSULTAS CLÍNICAS Y EVALUACIONES DE IA
        # ---------------------------------------------------------------------
        if seeded_courses:
            target_course = seeded_courses[1]  # Medicina Interna: Patología Gastrointestinal

            # Consulta 1: Completada con Evaluación de IA
            c_completed = Consultation.query.filter_by(
                student_id=student_santiago.id,
                course_id=target_course.id,
                status="COMPLETED",
            ).first()

            now = datetime.now(timezone.utc)
            if not c_completed:
                c_completed = Consultation(
                    student_id=student_santiago.id,
                    course_id=target_course.id,
                    title="Simulación: Paciente con Dolor Epigástrico Severo e Irradiación Dorsal",
                    specialty="Gastroenterología",
                    difficulty="MEDIUM",
                    status="COMPLETED",
                    score=88.5,
                    started_at=now - timedelta(hours=2),
                    finished_at=now - timedelta(hours=1, minutes=30),
                )
                db.session.add(c_completed)
                db.session.flush()

                # Evaluación de IA vinculada
                ai_eval = AiEvaluation(
                    consultation_id=c_completed.id,
                    final_score=88.5,
                    feedback_summary=(
                        "El estudiante demostró un interrogatorio clínico metódico. Identificó los síntomas "
                        "cardinales del cuadro biliar y solicitó de forma costo-efectiva la lipasa sérica y ecografía "
                        "hepatobiliar. Formuló adecuadamente los diagnósticos diferenciales sin incurrir en sesgo de anclaje."
                    ),
                    execution_time_seconds=14.2,
                )
                db.session.add(ai_eval)

            # Consulta 2: En curso (para probar chat y envío de mensajes en vivo)
            c_in_progress = Consultation.query.filter_by(
                student_id=student_santiago.id,
                course_id=target_course.id,
                status="IN_PROGRESS",
            ).first()

            if not c_in_progress:
                c_in_progress = Consultation(
                    student_id=student_santiago.id,
                    course_id=target_course.id,
                    title="Simulación Activa: Paciente Femenina con Dolor Abdominal Agudo",
                    specialty="Gastroenterología",
                    difficulty="MEDIUM",
                    status="IN_PROGRESS",
                    started_at=now - timedelta(minutes=15),
                )
                db.session.add(c_in_progress)

            db.session.commit()
            if verbose:
                print("  [+] Consultas clínicas y evaluaciones simuladas creadas")

        if verbose:
            print("[OK] Siembra de datos mock completada exitosamente!")
            print("   Credenciales de prueba disponibles:")
            print("   - Estudiante: sarias202@unab.edu.co / Estudiante2026*")
            print("   - Estudiante 2: estudiante@unab.edu.co / Estudiante2026*")
            print("   - Docente: docente@unab.edu.co / Docente2026*")
            print("   - Docente Cirugía: cpena@unab.edu.co / Docente2026*")
            print("   - Admin: admin@unab.edu.co / Admin2026*")


if __name__ == "__main__":
    seed_mock_data(verbose=True)
