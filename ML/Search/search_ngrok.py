from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer, util
import nest_asyncio
from pyngrok import ngrok
import uvicorn

# ✅ Apply nested event loop compatibility
nest_asyncio.apply()

# ✅ Create FastAPI app
app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")

# ✅ Request format
class Course(BaseModel):
    id: str
    title: str
    tags: List[str]

class SearchRequest(BaseModel):
    query: str
    courses: List[Course]

# ✅ Smart search function
def search_courses(query: str, courses: List[Course], top_k: int = 5):
    texts = [f"{course.title} {' '.join(course.tags)}" for course in courses]
    course_embeddings = model.encode(texts, convert_to_tensor=True)
    query_embedding = model.encode(query, convert_to_tensor=True)
    hits = util.semantic_search(query_embedding, course_embeddings, top_k=top_k)[0]
    return [{
        "id": courses[hit["corpus_id"]].id,
        "title": courses[hit["corpus_id"]].title,
        "tags": courses[hit["corpus_id"]].tags,
        "score": round(float(hit["score"]), 3)
    } for hit in hits]

# ✅ Route
@app.post("/search")
def search_endpoint(request: SearchRequest):
    return { "results": search_courses(request.query, request.courses) }

@app.get("/")
def root():
    return { "message": "Smart ML Search API Running 🚀" }

# ✅ ngrok setup with second token
ngrok.set_auth_token("2vgPAtpr2WjIuXcHr8PVK7l2hXz_2iTtB5YgsYM5RMQnT6btQ")
public_url = ngrok.connect(8001)
print("🚀 Public URL:", public_url)

# ✅ Run server
uvicorn.run(app, host="0.0.0.0", port=8001)
