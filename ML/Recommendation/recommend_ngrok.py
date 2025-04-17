from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nest_asyncio
from pyngrok import ngrok
import uvicorn

nest_asyncio.apply()

app = FastAPI()

class Course(BaseModel):
    title: str
    description: str
    tags: List[str]

class RequestModel(BaseModel):
    purchasedCourses: List[str]
    searchHistory: List[str]
    allCourses: List[Course]

@app.post("/api/recommend")
def recommend_courses(data: RequestModel):
    purchased = set(data.purchasedCourses)
    search_terms = data.searchHistory
    all_courses = data.allCourses

    available_courses = [c for c in all_courses if c.title not in purchased]
    if not available_courses:
        return []

    purchased_tags = []
    for course in all_courses:
        if course.title in purchased:
            purchased_tags.extend(course.tags)

    user_text = " ".join(search_terms + purchased_tags)
    corpus = [f"{c.title} {c.description} {' '.join(c.tags)}" for c in available_courses] + [user_text]

    tfidf = TfidfVectorizer()
    tfidf_matrix = tfidf.fit_transform(corpus)

    user_vector = tfidf_matrix[-1]
    course_vectors = tfidf_matrix[:-1]
    similarities = cosine_similarity(user_vector, course_vectors).flatten()

    top_indices = similarities.argsort()[::-1][:5]
    recommendations = [available_courses[i] for i in top_indices]

    return [r.dict() for r in recommendations]

# 🔐 Add your authtoken here (only needed once on a new machine)
ngrok.set_auth_token("2vgioCVpE125Nmrg4fVAfgFdKHP_7QAKrfioYnNVb7ufAxVVW")  #("2vgPAtpr2WjIuXcHr8PVK7l2hXz_2iTtB5YgsYM5RMQnT6btQ")

# 🌐 Start tunnel
public_url = ngrok.connect(8000)
print("🚀 FastAPI is live at:", public_url)

# 🌀 Start the FastAPI server
uvicorn.run(app, host="0.0.0.0", port=8000)
