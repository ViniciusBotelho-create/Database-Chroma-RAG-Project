from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.modules.rag_chat import get_response, ask_llm_direct
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ========================
# CONFIGURAÇÃO CORS
# ========================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# MODELO Pydantic
# ========================
class Question(BaseModel):
    input: str

# ========================
# ENDPOINTS
# ========================
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.modules.rag_chat import get_response, ask_llm_direct
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ========================
# CONFIGURAÇÃO CORS
# ========================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# MODELO Pydantic
# ========================
class Question(BaseModel):
    input: str

# ========================
# ENDPOINTS
# ========================
import traceback

@app.post("/ask")
async def ask_question(question: Question):
    try:
        response = get_response(question.input)
        return {
            "answer": response.get("answer", "⚠️ Não foi possível gerar uma resposta."),
            "refs": response.get("refs", []),
            "images": response.get("images", []),
        }
    except Exception as e:
        print("===== ERRO NO /ask =====")
        traceback.print_exc()   # mostra stack trace no terminal
        raise HTTPException(status_code=500, detail=f"Erro no /ask: {str(e)}")


@app.post("/llm")
async def ask_llm(question: Question):
    try:
        response = ask_llm_direct(question.input)
        return {"answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
