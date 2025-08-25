from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from modules.rag_chat import get_response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
    
