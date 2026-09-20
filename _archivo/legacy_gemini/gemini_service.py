# Puente: todo lo que pida app.py se va a Groq, 0 RAM
from groq_service import ask_chalamandra

def consultar_agente(prompt: str) -> str:
    return ask_chalamandra(prompt)

def ask_gemini(prompt: str) -> str:
    return ask_chalamandra(prompt)

def consultar(prompt: str) -> str:
    return ask_chalamandra(prompt)
