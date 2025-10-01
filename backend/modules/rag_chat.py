import torch
from typing import TypedDict
from pymilvus import connections, Collection
from transformers import AutoModel, AutoTokenizer
from langgraph.graph import StateGraph, END
import ollama

# ========================
# CONFIGURAÇÃO DO MILVUS
# ========================
connections.connect("default", host="127.0.0.1", port="19530")
COLLECTION_NAME = "rag_embeddings_milvus"
collection = Collection(COLLECTION_NAME)

# ========================
# EMBEDDINGS
# ========================
model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

def get_embedding(text: str):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings[0].numpy().tolist()

# ========================
# ESTADO COMPARTILHADO
# ========================
class ChatState(TypedDict):
    input: str
    query: str
    context: str
    refs: str
    images: str
    answer: str

# ========================
# AGENTE 1: RECUPERA TEXTO
# ========================
def retrieve_text_context(state: ChatState) -> ChatState:
    query = state["input"]
    query_emb = get_embedding(query)

    collection.load()
    results = collection.search(
        data=[query_emb],
        anns_field="embedding",
        param={"metric_type": "IP", "params": {"nprobe": 10}},
        limit=10,
        output_fields=["source_file", "source_url", "chunk_index", "chunk_text"]
    )

    contexts, refs = [], []
    for r in results[0]:
        chunk_text = r.entity.get("chunk_text")
        source = r.entity.get("source_file")
        url = r.entity.get("source_url")
        contexts.append(chunk_text)
        refs.append(f"📄 {source} | 🔗 {url}")

    return {**state, "query": query, "context": "\n\n".join(contexts), "refs": "\n".join(refs)}

# ========================
# AGENTE 2: RECUPERA IMAGENS
# ========================
def retrieve_image_context(state: ChatState) -> ChatState:
    query = state["input"]
    query_emb = get_embedding(query)

    image_collection = Collection("image_descriptions")
    image_collection.load()

    results = image_collection.search(
        data=[query_emb],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"nprobe": 10}},
        limit=5,
        output_fields=["id", "url", "category", "titles", "texts"]
    )

    images = []
    for r in results[0]:
        url = r.entity.get("url")
        titles = r.entity.get("titles")
        texts = r.entity.get("texts")
        category = r.entity.get("category")
        score = r.distance
        images.append(
            f"🖼️ {category} | {titles} | {texts[:80]}... ({url}) [score={score:.3f}]"
        )

    return {**state, "images": "\n".join(images)}

# ========================
# AGENTE 3: GERA RESPOSTA
# ========================
def generate_answer(state: ChatState) -> ChatState:
    prompt = f"""
Você é um assistente técnico especializado em licenciamento ambiental (EIA/RIMA).
Responda à pergunta do usuário **usando apenas o contexto fornecido**.

Contexto textual:
{state['context']}

Contexto visual (descrições de imagens):
{state['images']}

Pergunta:
{state['query']}
"""
    response = ollama.chat(
        model="mistral:7b",
        messages=[
            {"role": "system", "content": "Você é um assistente técnico ambiental especializado em EIA/RIMA."},
            {"role": "user", "content": prompt}
        ]
    )
    return {**state, "answer": response["message"]["content"]}

# ========================
# GRAFO MULTIAGENTE
# ========================
builder = StateGraph(ChatState)
builder.add_node("text_retriever", retrieve_text_context)
builder.add_node("image_retriever", retrieve_image_context)
builder.add_node("answer_generator", generate_answer)

builder.set_entry_point("text_retriever")
builder.add_edge("text_retriever", "image_retriever")
builder.add_edge("image_retriever", "answer_generator")
builder.add_edge("answer_generator", END)

graph = builder.compile()

# ========================
# FUNÇÕES PÚBLICAS
# ========================
def get_response(user_input: str) -> dict:
    state = {
        "input": user_input,
        "query": "",
        "context": "",
        "refs": "",
        "images": "",
        "answer": ""
    }
    result = graph.invoke(state)
    return result

def ask_llm_direct(user_input: str) -> str:
    """Pergunta direto para a LLM, sem RAG"""
    response = ollama.chat(
        model="mistral:7b",
        messages=[
            {"role": "system", "content": "Você é um assistente técnico ambiental especializado em EIA/RIMA."},
            {"role": "user", "content": user_input}
        ]
    )
    return response["message"]["content"]
