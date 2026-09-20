import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from gemini_service import consultar_agente

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chalamandra Magistral DecoX API")


class ChatRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        description="El mensaje o consulta que se enviará al agente.",
        examples=["Hola, ¿qué servicios ofrecen?"],
    )
    system_instruction: str = Field(
        default="Eres el agente inteligente de Chalamandra Magistral DecoX.",
        description="Instrucción de sistema para definir la personalidad del agente.",
    )


@app.get("/")
def read_root():
    return {"status": "online", "model": "gemini-3.6-flash"}


@app.post("/api/agente/chat", status_code=status.HTTP_200_OK)
async def chat_endpoint(payload: ChatRequest):
    clean_prompt = payload.prompt.strip()
    if not clean_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El prompt no puede estar vacío o contener solo espacios.",
        )

    try:
        respuesta = await run_in_threadpool(
            consultar_agente,
            prompt=clean_prompt,
            system_instruction=payload.system_instruction,
        )
        return {"status": "success", "respuesta": respuesta}

    except ValueError as ve:
        logger.warning(f"Error de configuración o validación: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve)
        )
    except Exception as e:
        logger.exception("Error no controlado al comunicarse con Gemini")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error interno al procesar la solicitud con el agente.",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000)
