import os
from typing import TypedDict
from pymilvus import connections, Collection
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from langgraph.graph import StateGraph, END

# ---- Conexão Milvus ----
connections.connect("default", host="localhost", port="19530")
text_collection = Collection("rag_embeddings_milvus")
image_collection = Collection("image_descriptions")

# ---- Modelos de embedding ----
embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# ---- Estado compartilhado ----
class ChatState(TypedDict):
    input: str
    query: str
    context: str
    image_context: str
    answer: str
    validation: str
    show_context: str

# ---- Agentes ----
def retrieve_text_context(state: ChatState) -> ChatState:
    query_embedding = embedding_model.encode(state["input"]).tolist()
    text_collection.load()
    results = text_collection.search(
        data=[query_embedding],
        anns_field="embedding",
        param={"metric_type": "L2", "params": {"nprobe": 10}},
        limit=5,
        output_fields=["text", "source"]
    )

    context_parts = []
    show_context = []
    for hit in results[0]:
        context_parts.append(hit.entity.get("text"))
        show_context.append(f"Documento: {hit.entity.get('source')}")

    return {
        **state,
        "context": "\n\n".join(context_parts),
        "show_context": "\n\n".join(show_context)
    }

def retrieve_image_context(state: ChatState) -> ChatState:
    query_embedding = embedding_model.encode(state["input"]).tolist()
    image_collection.load()
    results = image_collection.search(
        data=[query_embedding],
        anns_field="embedding",
        param={"metric_type": "L2", "params": {"nprobe": 10}},
        limit=5,
        output_fields=["url", "titles", "texts"]
    )

    image_contexts = []
    image_links = []
    for hit in results[0]:
        image_contexts.append(f"{hit.entity.get('titles')} {hit.entity.get('texts')}")
        image_links.append(hit.entity.get("url"))

    show_context = state.get("show_context", "")
    if image_links:
        show_context += "\n\nImagens relevantes:\n" + "\n".join(image_links)
    else:
        show_context += "\n\nNenhuma imagem relevante encontrada."

    return {
        **state,
        "image_context": "\n\n".join(image_contexts),
        "show_context": show_context
    }

def generate_answer(state: ChatState) -> ChatState:
    prompt = f"""
Você é um assistente técnico especialista em EIA/RIMA. Use apenas os contextos fornecidos para responder.

Contexto textual:
{state['context']}

Contexto de imagens:
{state['image_context']}

Pergunta:
{state['input']}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Assistente técnico ambiental especializado em EIA/RIMA."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=800
    )

    return {**state, "answer": response.choices[0].message.content.strip()}

def AnswerValidatorAgent(state: ChatState) -> ChatState:
    validation_prompt = f"""
Você é um validador técnico. Avalie a resposta de um assistente sobre EIA/RIMA.

Contexto textual:
{state['context']}

Contexto de imagens:
{state['image_context']}

Pergunta:
{state['input']}

Resposta do assistente:
{state['answer']}

Avalie se a resposta está correta e baseada no contexto. Se sim, responda "VALIDADO". Caso contrário, explique.
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Validador técnico de respostas."},
            {"role": "user", "content": validation_prompt}
        ],
        temperature=0,
        max_tokens=300
    )

    return {**state, "validation": response.choices[0].message.content.strip()}

# ---- Grafo ----
builder = StateGraph(ChatState)
builder.add_node("text_retriever", retrieve_text_context)
builder.add_node("image_retriever", retrieve_image_context)
builder.add_node("chat", generate_answer)
builder.add_node("validator", AnswerValidatorAgent)

builder.set_entry_point("text_retriever")
builder.add_edge("text_retriever", "image_retriever")
builder.add_edge("image_retriever", "chat")
builder.add_edge("chat", "validator")
builder.add_edge("validator", END)

graph = builder.compile()

# ---- Função para chamar o grafo ----
def get_response(query: str):
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
    return result["answer"], result["show_context"], result["validation"]
