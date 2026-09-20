import os
from google import genai
from google.genai import types

def obtener_cliente():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("La variable de entorno GEMINI_API_KEY no está configurada.")
    return genai.Client(api_key=api_key)

def consultar_agente(prompt: str, system_instruction: str = None) -> str:
    """Envía una consulta al modelo gemini-3.6-flash."""
    client = obtener_cliente()
    
    config = None
    if system_instruction:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction
        )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=config,
    )
    return response.text
