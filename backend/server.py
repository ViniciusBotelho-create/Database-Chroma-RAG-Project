from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from modules.rag_chat import get_response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permite requisições do frontend em localhost:5173
origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    input: str

@app.post("/ask")
async def ask_question(question: Question):
    try:
        # Obtém a resposta utilizando o RAG
        response = get_response(question.input)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
