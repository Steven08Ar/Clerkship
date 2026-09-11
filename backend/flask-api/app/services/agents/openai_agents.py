"""
OpenAI / ChatGPT implementation of ClinicAI UNAB AI Agent 2 (Paciente Virtual Estandarizado).

Simula el diálogo clínico en tiempo real durante la anamnesis médica, adoptando
la personalidad de un paciente colombiano, respondiendo con lenguaje natural coloquial,
modulando su estado afectivo y reportando su escala de dolor subjetiva.

Cuenta con fallback automático y transparente hacia el Mock determinista
si la OPENAI_API_KEY no está configurada o ante contingencias de cuota/red.
"""

from datetime import datetime, timezone
import json
import logging
import os
from typing import Optional

from app.schemas.agentes import (
    PatientChatRequest,
    PatientChatResponse,
)
from app.services.agents.base import BaseVirtualPatientAgent
from app.services.agents.clinical_cases_data import (
    CLINICAL_CASES_DATA,
    get_case_by_id,
)
from app.services.agents.mock_agents import MockVirtualPatientAgent

logger = logging.getLogger(__name__)


class OpenAIVirtualPatientAgent(BaseVirtualPatientAgent):
    """
    Agente 2: Paciente Virtual Estandarizado impulsado por OpenAI (ChatGPT).
    Responde en lenguaje natural realista adaptado a la patología y dolor del caso clínico.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = (api_key or os.getenv("OPENAI_API_KEY", "")).strip()
        self.model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self._fallback_agent = MockVirtualPatientAgent()
        self._client = None

        if self.api_key:
            try:
                from openai import OpenAI

                self._client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.warning("No se pudo inicializar el cliente de OpenAI: %s. Se usará Mock.", e)
                self._client = None

    def respond_to_student(self, request: PatientChatRequest) -> PatientChatResponse:
        """Genera la respuesta del paciente virtual en lenguaje natural o recurre al Mock de respaldo."""
        if not self._client:
            logger.info("OPENAI_API_KEY no configurada. Utilizando Agente 2 Mock de respaldo.")
            return self._fallback_agent.respond_to_student(request)

        # Contexto clínico del paciente a partir del caso seleccionado
        case_id = request.case_id or "CASE-GI-001"
        case_data = get_case_by_id(case_id) or CLINICAL_CASES_DATA.get("CASE-GI-001", {})

        demographics = case_data.get("demographics", {})
        age = demographics.get("age", 45)
        gender = demographics.get("gender", "M")
        occupation = demographics.get("occupation", "Comerciante")
        chief_complaint = case_data.get("chief_complaint", "Tengo dolor en la boca del estómago.")
        present_illness = case_data.get("present_illness", "")
        med_history = case_data.get("medical_history", {})
        condition = case_data.get("condition", "Dolor abdominal agudo")

        system_prompt = f"""
Eres un paciente estandarizado en una consulta médica o servicio de urgencias en Colombia, interactuando con un estudiante de medicina / médico interno (Clerkship UNAB).

DATOS DE TU PERSONAJE:
- Edad: {age} años
- Sexo: {'Masculino' if gender == 'M' else 'Femenino'}
- Ocupación: {occupation}
- Motivo de consulta inicial: "{chief_complaint}"
- Cuadro patológico real de base: {condition}
- Resumen de tu enfermedad actual: {present_illness}
- Antecedentes personales y familiares: {json.dumps(med_history, ensure_ascii=False)}

REGLAS DE ACTUACIÓN Y COMPORTAMIENTO:
1. Responde de forma concisa (máximo 2-4 oraciones), directa y en lenguaje coloquial latinoamericano/colombiano.
2. NO uses terminología médica especializada (no digas 'epigastrio', di 'en la boca del estómago'; no digas 'emesis', di 'vómitos'; no digas 'hialino', di 'amarillo clarito'). Solo usa términos médicos si previamente un doctor te los explicó en una consulta anterior (por ejemplo si ya te habían dicho que tenías 'cálculos en la vesícula').
3. Si el doctor te saluda o pregunta cómo estás, salúdalo con respeto pero deja ver tu malestar o dolor.
4. Si te preguntan si tomaste algo, menciona tus remedios caseros o pastillas según tus antecedentes.
5. Mantén absoluta coherencia fisiopatológica con tu caso: no inventes síntomas contradictorios.
6. Tu respuesta DEBE ser un objeto JSON válido con exactamente estos campos:
   - "reply": (string) La respuesta en primera persona que le dices al médico.
   - "pain_scale_reported": (integer de 0 a 10) El nivel de dolor que estás sintiendo en este momento.
   - "emotional_state": (string) Tu estado de ánimo ("quejumbroso", "angustiado", "atemorizado", "tranquilo").
"""

        try:
            completion = self._client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
            )

            raw_content = completion.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)

            reply = parsed.get("reply", "Ay doctor, me duele bastante aquí en la boca del estómago.")
            pain = parsed.get("pain_scale_reported", 8)
            emotion = parsed.get("emotional_state", "angustiado")

            return PatientChatResponse(
                consultation_id=request.consultation_id,
                reply=reply,
                pain_scale_reported=int(pain) if isinstance(pain, (int, float)) else 8,
                emotional_state=emotion,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )

        except Exception as exc:
            logger.error("Error al invocar OpenAI / ChatGPT en Agente 2 (Paciente Virtual): %s. Activando fallback a Mock.", exc)
            return self._fallback_agent.respond_to_student(request)

