"""
AI Agents Service Package for ClinicAI UNAB.

Provides singleton factory accessors for:
- Agente 1: Case Generator / Presenter
- Agente 2: Virtual Patient Simulator
- Agente 3: Clinical Reasoning Evaluator
"""

import os
from app.services.agents.base import (
    BaseCaseGeneratorAgent,
    BaseClinicalEvaluatorAgent,
    BaseVirtualPatientAgent,
)
from app.services.agents.mock_agents import (
    MockCaseGeneratorAgent,
    MockClinicalEvaluatorAgent,
    MockVirtualPatientAgent,
)

# Singletons for mock agents
_case_generator = MockCaseGeneratorAgent()
_virtual_patient = MockVirtualPatientAgent()
_clinical_evaluator = MockClinicalEvaluatorAgent()


def get_case_generator_agent() -> BaseCaseGeneratorAgent:
    """
    Returns an instance of Case Generator Agent.
    Future: Can switch to OpenAIBasedCaseGenerator or GeminiBasedCaseGenerator
    depending on app.config or environment variables.
    """
    provider = os.getenv("AI_AGENT_PROVIDER", "mock").lower()
    if provider == "mock":
        return _case_generator
    # Future providers:
    # elif provider == "gemini":
    #     return GeminiCaseGeneratorAgent(...)
    # elif provider == "openai":
    #     return OpenAICaseGeneratorAgent(...)
    return _case_generator


def get_virtual_patient_agent() -> BaseVirtualPatientAgent:
    """
    Returns an instance of Virtual Patient Agent.
    """
    provider = os.getenv("AI_AGENT_PROVIDER", "mock").lower()
    if provider == "mock":
        return _virtual_patient
    return _virtual_patient


def get_clinical_evaluator_agent() -> BaseClinicalEvaluatorAgent:
    """
    Returns an instance of Clinical Evaluator Agent.
    """
    provider = os.getenv("AI_AGENT_PROVIDER", "mock").lower()
    if provider == "mock":
        return _clinical_evaluator
    return _clinical_evaluator


__all__ = [
    "BaseCaseGeneratorAgent",
    "BaseVirtualPatientAgent",
    "BaseClinicalEvaluatorAgent",
    "MockCaseGeneratorAgent",
    "MockVirtualPatientAgent",
    "MockClinicalEvaluatorAgent",
    "get_case_generator_agent",
    "get_virtual_patient_agent",
    "get_clinical_evaluator_agent",
]

