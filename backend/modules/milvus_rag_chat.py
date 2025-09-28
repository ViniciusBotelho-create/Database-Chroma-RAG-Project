import torch
from pymilvus import connections, Collection
from transformers import AutoModel, AutoTokenizer
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

# FUNÇÃO DE RECUPERAÇÃO DO CONTEXTO

# ========================

def retrieve_context(query: str, top_k: int = 15):
query_emb = get_embedding(query)

```
collection.load()
results = collection.search(
    data=[query_emb],
    anns_field="embedding",
    param={"metric_type": "IP", "params": {"nprobe": 10}},
    limit=top_k,
    output_fields=["source_file", "source_url", "chunk_index", "chunk_text"]
)

contexts = []
refs = []
for r in results[0]:
    chunk_text = r.entity.get("chunk_text")
    source = r.entity.get("source_file")
    url = r.entity.get("source_url")
    contexts.append(chunk_text)
    refs.append(f"📄 {source} | 🔗 {url}")

return "\n\n".join(contexts), "\n".join(refs)
```

def retrieve_images(query: str, top_k: int = 5):
query_emb = get_embedding(query)

```
image_collection = Collection("image_descriptions")
image_collection.load()

results = image_collection.search(
    data=[query_emb],
    anns_field="embedding",
    param={"metric_type": "COSINE", "params": {"nprobe": 10}},
    limit=top_k,
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

return "\n".join(images)
```

# ========================

# FUNÇÕES DE RESPOSTA

# ========================

def generate_answer(query: str, context: str):
prompt = f"""
Você é um assistente técnico especializado em licenciamento ambiental (EIA/RIMA).
Responda à pergunta do usuário **usando apenas o contexto fornecido**.

Contexto:
{context}

Pergunta:
{query}

Responda de forma clara, objetiva e técnica.
"""
response = ollama.chat(
model="mistral:7b",
messages=[
{"role": "system", "content": "Você é um assistente técnico ambiental especializado em EIA/RIMA."},
{"role": "user", "content": prompt}
]
)
return response["message"]["content"]

def generate_llm_only(query: str):
prompt = f"""
Você é um assistente técnico especializado em EIA/RIMA.
Responda à pergunta do usuário de forma clara, objetiva e técnica.
Pergunta: {query}
"""
response = ollama.chat(
model="mistral:7b",
messages=[
{"role": "system", "content": "Você é um assistente técnico ambiental especializado em EIA/RIMA."},
{"role": "user", "content": prompt}
]
)
return response["message"]["content"]
