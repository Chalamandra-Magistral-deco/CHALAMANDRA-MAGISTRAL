import os
from google import genai
from google.genai import types

def inicializar_cliente():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Error: GEMINI_API_KEY no encontrada en el entorno.")
    return genai.Client(api_key=api_key)

def procesar_consulta_decox(prompt_usuario: str, sistema_contexto: str = None) -> str:
    client = inicializar_cliente()
    
    config = types.GenerateContentConfig(
        system_instruction=sistema_contexto or "Eres el motor analítico de Chalamandra Magistral DecoX.",
        temperature=0.7,
    )
    
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt_usuario,
        config=config
    )
    return response.text

if __name__ == "__main__":
    print("Módulo gemini_service.py listo para importación.")
