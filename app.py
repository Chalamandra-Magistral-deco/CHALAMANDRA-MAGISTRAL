import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gemini_service import consultar_agente

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chalamandra Magistral DecoX API")

class ChatRequest(BaseModel):
    prompt: str
    system_instruction: str = "Eres el agente inteligente de Chalamandra Magistral DecoX."

@app.get("/")
def read_root():
    return {"status": "online", "model": "gemini-3.6-flash"}

@app.post("/api/agente/chat")
async def chat_endpoint(payload: ChatRequest):
    try:
        respuesta = consultar_agente(
            prompt=payload.prompt,
            system_instruction=payload.system_instruction
        )
        return {"status": "success", "respuesta": respuesta}
    except ValueError as ve:
        logger.error(f"Error de configuración: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception("Error al comunicarse con Gemini")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
