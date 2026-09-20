import sys
import os
from google import genai
from google.genai import types

MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"]

def main():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY no configurada.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    pipe_input = ""
    if not sys.stdin.isatty():
        pipe_input = sys.stdin.read().strip()

    args = sys.argv[1:]

    if not args and not pipe_input:
        print("Uso: gemini \"tu consulta\"")
        sys.exit(0)

    prompt_parts = []
    for arg in args:
        if os.path.isfile(arg):
            try:
                with open(arg, 'r', encoding='utf-8') as f:
                    prompt_parts.append(f"--- {arg} ---{f.read()}")
            except Exception as e:
                print(f"Error: {e}")
                sys.exit(1)
        else:
            prompt_parts.append(arg)

    if pipe_input:
        prompt_parts.append(f"--- Stdin ---{pipe_input}")

    full_prompt = "\n\n".join(prompt_parts)

    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction="Eres un asistente de terminal conciso.",
                    tools=[]
                )
            )
            if response and response.text:
                print("\n" + response.text + "\n")
                return
        except Exception:
            continue

    print("Error: Cuota API agotada. Intenta ma\u00f1ana ob cambia de API_KEY.")

if __name__ == "__main__":
    main()
