import sys
import os
import asyncio
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
load_dotenv()

from chalamandra_sdk import Agent, LocalAgentConfig

async def ejecutar_cli():
    if len(sys.argv) < 2:
        print("Uso: python3 chalamandra_cli.py <prompt>")
        sys.exit(1)
        
    prompt = " ".join(sys.argv[1:])
    async with Agent(LocalAgentConfig()) as agent:
        res = await agent.chat(prompt)
        print(await res.text())

if __name__ == "__main__":
    asyncio.run(ejecutar_cli())
