import chromadb
import openai
import os

from pymongo import MongoClient
from chromadb.config import Settings
from openai import OpenAI
from langchain_openai import OpenAIEmbeddings
from langgraph.graph import StateGraph, END
from langgraph.graph.message import MessageGraph
from typing import TypedDict, Annotated
from langchain_core.messages import HumanMessage
from langchain_core.runnables import Runnable, RunnableLambda
from sentence_transformers import SentenceTransformer

#conexões com os bancos de dados

# Conexão com o ChromaClient Persistente
chroma_path = os.path.abspath("./chroma_db")
chroma_client = chromadb.PersistentClient(path=chroma_path)

# Chave da API da openai
openai_api_key = os.getenv("OPENAI_API_KEY")

# Conectar ao MongoDB
mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["rag_db"]
mongo_chunks = mongo_db["chunks"]
mongo_images = mongo_db["images"]



collection = chroma_client.get_collection("rag_embeddings")
image_collection = chroma_client.get_collection(name="image_descriptions")

# Inicializar embeddings
embedding_model = OpenAIEmbeddings(openai_api_key=openai_api_key) #text-embedding-ada-002



# Definindo os estados compartilhados
class ChatState(TypedDict):
    input: str
    query: str
    context: str
    image_context: str
    answer: str
    validation: str
    show_context: str

# Agente de busca textual
def retrieve_text_context(state: ChatState) -> ChatState:
    query = state["input"]
    query_embedding = embedding_model.embed_query(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5
    )

    chunk_ids = [
        result["source_file"] + "_chunk_" + str(result["chunk_index"])
        for result in results["metadatas"][0]
    ]
    
    show_context = []
    chunks_text = []
    for chunk_id in chunk_ids:
        chunk = mongo_chunks.find_one({"chunk_id": chunk_id})
        if chunk:
            chunks_text.append(chunk["chunk_text"])
            show_context.append(f"\nContexto retirado do documento: {chunk['pdf_file']}\nLink para o documento: {chunk['source_url']}")
    return {
        **state,
        "query": query,
        "context": "\n\n".join(chunks_text),
        "show_context": "\n\n".join(show_context)
    }

# Agente de busca de contexto por imagens relacionadas à query
def retrieve_image_context(state: ChatState) -> ChatState:
    query = state["input"]
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = embedding_model.encode(query).tolist()

    results = image_collection.query(
        query_embeddings=[query_embedding],
        n_results=5
    )

    ids = results["ids"][0]
    distances = results["distances"][0]

    image_contexts = []
    image_links = []
    show_context = state.get("show_context", "")

    for id_, distance in zip(ids, distances):
        if distance < 0.65:
            image_doc = mongo_images.find_one({"id": id_})
            if image_doc:
                image_url = image_doc.get("url")
                if image_url:
                    image_contexts.append(image_url)
                    image_links.append(image_url)

    if image_links:
        show_context += "\n\n" + "\n".join(image_links)
    else:
        show_context += "\n\nNão foram encontradas imagens relevantes."

    return {
        **state,
        "image_context": "\n\n".join(image_contexts),
        "show_context": show_context.strip()
    }



# Agente que gera a resposta usando OpenAI
def generate_answer(state: ChatState) -> ChatState:
    client = openai.OpenAI(api_key=openai_api_key)

    prompt = f"""
Você é um assistente especialista em licenciamento ambiental, com foco em auxiliar na elaboração de documentos EIA e RIMA. Use exclusivamente os contextos a seguir para responder de forma precisa e técnica.

Contexto textual:
{state['context']}

Contexto de imagens (descrições ou legendas):
{state['image_context']}

Pergunta:
{state['query']}
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Você é um assistente técnico ambiental especializado em EIA e RIMA."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=1000
    )

    return {
        **state,
        "answer": response.choices[0].message.content.strip()
    }

# Agente validador da resposta
def AnswerValidatorAgent(state: ChatState) -> ChatState:
    client = openai.OpenAI(api_key=openai_api_key)

    answer = state["answer"]
    context = state["context"]
    image_context = state["image_context"]
    query = state["query"]

    validation_prompt = f"""
Você é um validador técnico. Avalie a resposta de um assistente que tenta responder perguntas sobre EIA e RIMA com base em contextos textuais e visuais.

Contexto textual:
{context}

Contexto de imagens:
{image_context}

Pergunta feita:
{query}

Resposta do assistente:
{answer}

Agora avalie a resposta com base nos critérios abaixo:
1. A resposta está diretamente relacionada aos contextos fornecidos?
2. Há alguma afirmação vaga, genérica ou sem apoio no contexto?
3. A linguagem está tecnicamente correta e clara?

Se a resposta estiver satisfatória, diga "VALIDADO".
Se não, explique o problema encontrado.
"""

    validation_response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Você é um validador técnico de respostas geradas por IA."},
            {"role": "user", "content": validation_prompt}
        ],
        temperature=0,
        max_tokens=500
    )

    validation = validation_response.choices[0].message.content.strip()

    return {
        **state,
        "validation": validation
    }

# Construção do grafo
builder = StateGraph(ChatState)

# Adiciona os nós
builder.add_node("text_retriever", retrieve_text_context)
builder.add_node("image_retriever", retrieve_image_context)
builder.add_node("chat", generate_answer)
builder.add_node("validator", AnswerValidatorAgent)

# Define conexões entre os nós
builder.set_entry_point("text_retriever")
builder.add_edge("text_retriever", "image_retriever")
builder.add_edge("image_retriever", "chat")
builder.add_edge("chat", "validator")
builder.add_edge("validator", END)

# Compila o grafo
graph = builder.compile()


# Função para obter a resposta e o contexto
def get_response(query: str) -> str:
    state = {
        "input": query,
        "query": query,
        "context": "",
        "image_context": "",
        "answer": "",
        "validation": "",
        "show_context": ""
    }

    result = graph.invoke(state)

    # Retorna a resposta e o contexto
    return result["answer"], result["show_context"]
