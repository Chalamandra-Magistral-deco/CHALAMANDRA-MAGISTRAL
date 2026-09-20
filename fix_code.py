import sys
import os
import requests

if len(sys.argv) < 2:
    print("Uso: python fix_code.py <ruta_al_archivo_o_codigo>")
    sys.exit(1)

target = sys.argv[1]

if os.path.isfile(target):
    with open(target, "r", encoding="utf-8") as f:
        code_content = f.read()
    filename = target
else:
    code_content = target
    filename = "Snippet"

system_prompt = (
    "Eres un desarrollador Senior especializado en depuración y refactorización de código. "
    "Tu objetivo es: 1. Identificar errores sintácticos o lógicos. 2. Explicar brevemente la causa raíz. "
    "3. Entregar la versión corregida y optimizada dentro de un bloque de código."
)

payload = {
    "prompt": f"Revisa y corrige este código ({filename}):\n\n```\n{code_content}\n```",
    "system_instruction": system_prompt
}

try:
    response = requests.post("http://localhost:8000/api/agente/chat", json=payload)
    if response.status_code == 200:
        print("\n--- DIAGNÓSTICO Y CORRECCIÓN DE TU AGENTE ---\n")
        print(response.json()["respuesta"])
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Error al conectar con la API local: {e}")
