#!/home/brasdefer1597/venv/bin/python3
import sys
from google import genai
from google.genai import types

def run_prompt(prompt_text: str):
    client = genai.Client()
    
    config = types.GenerateContentConfig(
        safety_settings=[
            types.SafetySetting(category=cat, threshold=types.HarmBlockThreshold.BLOCK_NONE)
            for cat in [
                types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            ]
        ],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_text,
        config=config,
    )
    return response.text

if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Confirma estado."
    print(run_prompt(prompt))
