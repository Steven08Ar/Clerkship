"""
Google Gemini implementations of ClinicAI UNAB AI Agents (Agente 1 y Agente 3).

- Agente 1: Generador / Presentador de Casos Clínicos (vía Google Gemini).
- Agente 3: Tutor Evaluador de Razonamiento Clínico y Sesgos Cognitivos (vía Google Gemini).

Utiliza el SDK oficial moderno `google-genai` con salidas JSON estructuradas (Pydantic Schema).
Cuenta con fallback automático y transparente hacia los agentes Mock deterministas
si la API key no está configurada o ante fallos de cuota/red.
"""

import json
import logging
import os
from typing import Optional

from app.schemas.agentes import (
    EvaluateSessionRequest,
    EvaluationResultResponse,
    GenerateCaseRequest,
    GeneratedCaseResponse,
)
from app.services.agents.base import (
    BaseCaseGeneratorAgent,
    BaseClinicalEvaluatorAgent,
)
from app.services.agents.clinical_cases_data import (
    CLINICAL_CASES_DATA,
    get_case_by_id,
)
from app.services.agents.mock_agents import (
    MockCaseGeneratorAgent,
    MockClinicalEvaluatorAgent,
)

logger = logging.getLogger(__name__)


class GeminiCaseGeneratorAgent(BaseCaseGeneratorAgent):
    """
    Agente 1: Generador / Presentador de Casos Clínicos impulsado por Google Gemini.
    Genera viñetas clínicas realistas y estructuradas según la especialidad y dificultad solicitadas.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip()
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self._fallback_agent = MockCaseGeneratorAgent()
        self._client = None

        if self.api_key:
            try:
                from google import genai

                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("No se pudo inicializar el cliente de Gemini: %s. Se usará Mock.", e)
                self._client = None

    def generate_case(self, request: GenerateCaseRequest) -> GeneratedCaseResponse:
        """Genera una viñeta clínica estructurada utilizando Gemini o recurre al Mock de respaldo."""
        if not self._client:
            logger.info("GEMINI_API_KEY no configurada. Utilizando Agente 1 Mock de respaldo.")
            return self._fallback_agent.generate_case(request)

        specialty = request.specialty or "Gastroenterología"
        difficulty = request.difficulty or "MEDIUM"
        condition = request.condition or "Patología Gastrointestinal Aguda"

        prompt = f"""
Actúa como un médico docente especialista en educación médica y simulación clínica para estudiantes de internado rotatorio (Clerkship).
Tu tarea es generar un caso clínico completo, pedagógico, realista y clínicamente verosímil para la plataforma ClinicAI UNAB.

PARÁMETROS DEL CASO:
- Especialidad: {specialty}
- Nivel de Dificultad: {difficulty}
- Condición / Síndrome clínico sugerido: {condition}

INSTRUCCIONES CLÍNICAS:
1. Genera una viñeta coherente con la epidemiología y guías de práctica clínica de Colombia / Latinoamérica.
2. Define un identificador único para el caso con formato 'CASE-XXX-NNN' (por ejemplo 'CASE-GI-005').
3. El motivo de consulta ('chief_complaint') debe ser en palabras del paciente (lenguaje coloquial).
4. La enfermedad actual ('present_illness') debe ser una redacción semiológica médica rigurosa (cronología, semiología del dolor ALICIA, síntomas asociados, factores modificadores).
5. Incluye antecedentes médicos completos (patológicos, quirúrgicos, farmacológicos, alérgicos, hábitos tóxicos, familiares).
6. Registra signos vitales cuantitativos fisiológicamente plausibles (tensión arterial, frecuencia cardíaca, frecuencia respiratoria, temperatura en °C, saturación de O2 en %).
7. El examen físico debe describir hallazgos positivos y negativos pertinentes por sistemas (general, cabeza/cuello, cardiopulmonar, abdomen detallado, extremidades).
8. En 'ground_truth' establece el diagnóstico definitivo de referencia, el código CIE-10 estimado, los exámenes paraclínicos indispensables para confirmarlo, y al menos 2 diagnósticos diferenciales plausibles.
"""

        try:
            from google.genai import types

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=GeneratedCaseResponse.model_json_schema(),
                    temperature=0.3,
                ),
            )

            raw_text = response.text.strip()
            return GeneratedCaseResponse.model_validate_json(raw_text)

        except Exception as exc:
            logger.error("Error al invocar Google Gemini en Agente 1 (Generador de Casos): %s. Activando fallback a Mock.", exc)
            return self._fallback_agent.generate_case(request)


class GeminiClinicalEvaluatorAgent(BaseClinicalEvaluatorAgent):
    """
    Agente 3: Tutor Evaluador de Razonamiento Clínico impulsado por Google Gemini.
    Evalúa la sesión del estudiante comparándola contra el Ground Truth, califica 4 dominios
    y detecta sesgos cognitivos según la Teoría de Procesamiento Dual (Sistema 1 vs Sistema 2).
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GEMINI_API_KEY", "")).strip()
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self._fallback_agent = MockClinicalEvaluatorAgent()
        self._client = None

        if self.api_key:
            try:
                from google import genai

                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("No se pudo inicializar Gemini para Agente 3: %s. Se usará Mock.", e)
                self._client = None

    def evaluate_session(self, request: EvaluateSessionRequest) -> EvaluationResultResponse:
        """Evalúa el desempeño del estudiante con Gemini o recurre al Mock de respaldo."""
        if not self._client:
            logger.info("GEMINI_API_KEY no configurada. Utilizando Agente 3 Mock de respaldo.")
            return self._fallback_agent.evaluate_session(request)

        # Contexto del estándar de referencia (Ground Truth)
        case_data = get_case_by_id(request.case_id) or CLINICAL_CASES_DATA.get("CASE-GI-001", {})
        ground_truth = case_data.get("ground_truth", {})
        definitive_diagnosis = ground_truth.get("definitive_diagnosis", "Patología gastrointestinal aguda")
        key_tests = ground_truth.get("key_diagnostic_tests", [])
        acceptable_differentials = ground_truth.get("acceptable_differentials", [])

        # Formatear transcripción de la conversación
        dialogue_text = "\n".join(
            f"- [{m.sender}]: {m.message}" for m in request.chat_history
        ) if request.chat_history else "Sin mensajes registrados."

        prompt = f"""
Actúa como un Médico Tutor Evaluador de Educación Médica Superior experto en Razonamiento Clínico y Metacognición Médica.
Tu misión es evaluar el desempeño de un estudiante de medicina / médico interno durante una simulación clínica.

MARCO PEDAGÓGICO: TEORÍA DE PROCESAMIENTO DUAL DE PAT CROSSETTY Y DANIEL KAHNEMAN:
- Sistema 1 (Intuitivo / Heurístico): Reconocimiento rápido de patrones, propenso a sesgos si no se calibra.
- Sistema 2 (Analítico / Deliberativo): Razonamiento deductivo, contrastación de hipótesis y verificación paraclínica.

DATOS DEL CASO CLÍNICO:
- ID del Caso: {request.case_id}
- Diagnóstico Estándar de Oro (Ground Truth): {definitive_diagnosis}
- Paraclínicos Clave Requeridos: {json.dumps(key_tests, ensure_ascii=False)}
- Diagnósticos Diferenciales Aceptables: {json.dumps(acceptable_differentials, ensure_ascii=False)}

ACCIONES REGISTRADAS DEL ESTUDIANTE:
- Diagnóstico Final propuesto por el estudiante: "{request.final_diagnosis}"
- Diagnósticos Diferenciales planteados: {json.dumps(request.differential_diagnoses, ensure_ascii=False)}
- Exámenes Paraclínicos e Imágenes solicitados: {json.dumps(request.requested_tests, ensure_ascii=False)}
- Transcripción del Interrogatorio Clínico:
{dialogue_text}

TAREAS DE EVALUACIÓN:
1. Califica de 0.0 a 100.0 los 4 dominios clínicos:
   - anamnesis: Calidad, pertinencia semiológica, exploración del síntoma cardinal y factores de riesgo.
   - diagnostic_tests: Pertinencia, costo-efectividad y alineación de los paraclínicos solicitados con guías.
   - differential_hypotheses: Capacidad de formular hipótesis diagnósticas alternativas plausibles.
   - final_diagnosis: Acierto y precisión del diagnóstico definitivo frente al estándar de oro.
2. Calcula 'final_score' como promedio ponderado (30% anamnesis + 25% tests + 20% diferenciales + 25% diagnóstico final).
3. Evalúa la presencia o ausencia de los 3 sesgos cognitivos cardinales (detectado true/false con explicación pedagógica):
   - 'Sesgo de Anclaje': Se fija en la primera impresión clínica sin considerar diagnósticos alternativos.
   - 'Cierre Prematuro': Emite el diagnóstico antes de tiempo sin suficiente soporte o interrogatorio.
   - 'Sesgo de Confirmación': Ordena exámenes exclusivamente orientados a ratificar su única sospecha preconcebida.
4. Redacta 'feedback_summary' constructivo, 2-3 'strengths' (fortalezas) y 2-3 'areas_for_improvement' (áreas de mejora).
5. Completa 'comparison_with_ground_truth' contrastando el diagnóstico y exámenes del estudiante con el estándar de oro.
"""

        try:
            from google.genai import types

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_json_schema=EvaluationResultResponse.model_json_schema(),
                    temperature=0.2,
                ),
            )

            raw_text = response.text.strip()
            parsed: EvaluationResultResponse = EvaluationResultResponse.model_validate_json(raw_text)
            if request.consultation_id and not parsed.consultation_id:
                parsed.consultation_id = request.consultation_id
            return parsed

        except Exception as exc:
            logger.error("Error al invocar Google Gemini en Agente 3 (Evaluador): %s. Activando fallback a Mock.", exc)
            return self._fallback_agent.evaluate_session(request)

