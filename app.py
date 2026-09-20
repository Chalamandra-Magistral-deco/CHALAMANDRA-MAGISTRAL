import logging
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from chalamandra_sdk import Agent, LocalAgentConfig

app = FastAPI(
    title="Chalamandra Magistral API",
    description="API para orquestación de agentes con 0 RAM local vía Groq",
    version="1.0.0"
)

class MensajeAgente(BaseModel):
    prompt: str = Field(..., description="El mensaje o consulta que se enviará al agente.")
    system_instruction: str = Field(
        default="Eres el agente inteligente de Chalamandra Magistral DecoX.",
        description="Instrucción de sistema para definir la personalidad del agente."
    )

@app.get("/")
def read_root():
    return {"status": "online", "model": "llama-3.3-70b-versatile", "sdk": "chalamandra_sdk"}

@app.post("/api/agente/chat", status_code=status.HTTP_200_OK)
async def chat_agente(payload: MensajeAgente):
    try:
        async with Agent(LocalAgentConfig()) as agent:
            respuesta = await agent.chat(payload.prompt)
            texto = await respuesta.text()
            return {"respuesta": texto}
    except Exception as e:
        logging.error(f"Error en chat_agente: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la solicitud con el agente: {str(e)}"
        )
