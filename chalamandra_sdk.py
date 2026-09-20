import pathlib
import difflib
import asyncio
import re
from groq_service import ask_chalamandra

class LocalAgentConfig:
    def __init__(self, model="llama-3.3-70b-versatile", allow_shell=False):
        self.model = model
        self.allow_shell = allow_shell

class _Response:
    def __init__(self, text):
        self._text = text
    async def text(self):
        return self._text
    def __str__(self):
        return self._text

class Agent:
    def __init__(self, config=None):
        self.config = config or LocalAgentConfig()

    async def __aenter__(self):
        return self
    async def __aexit__(self, *a):
        return False

    async def chat(self, prompt: str):
        loop = asyncio.get_running_loop()
        txt = await loop.run_in_executor(None, ask_chalamandra, prompt)
        return _Response(txt)

    def edit_file(self, ruta, instruccion, auto_save=False):
        p = pathlib.Path(ruta)
        viejo = p.read_text(encoding="utf-8", errors="ignore")
        prompt = f"Eres editor. Archivo {ruta}. Instruccion: {instruccion}. Devuelve SOLO codigo completo.\n\n{viejo}"
        nuevo = ask_chalamandra(prompt)
        
        match = re.search(r"```(?:\w+)?\n(.*?)```", nuevo, re.DOTALL)
        if match:
            nuevo = match.group(1).strip()
        else:
            nuevo = nuevo.strip()

        diff = "\n".join(difflib.unified_diff(viejo.splitlines(), nuevo.splitlines(), lineterm=""))
        print("=== DIFF PROPUESTO ===")
        print(diff[:4000])
        
        if auto_save or input("Guardar? [s/n]: ").lower().startswith("s"):
            p.with_suffix(p.suffix + ".bak").write_text(viejo, encoding="utf-8")
            p.write_text(nuevo, encoding="utf-8")
            print(f"Guardado en {ruta}")
        return nuevo

__all__ = ["Agent", "LocalAgentConfig"]
