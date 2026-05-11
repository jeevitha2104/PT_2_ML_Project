from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from model.predict import predict_glass

app = FastAPI(title="Glass Analysis API")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GlassFeatures(BaseModel):
    RI: float
    Na: float
    Mg: float
    Al: float
    Si: float
    K: float
    Ca: float
    Ba: float
    Fe: float

@app.post("/predict")
def predict(features: GlassFeatures):
    feature_list = [
        features.RI,
        features.Na,
        features.Mg,
        features.Al,
        features.Si,
        features.K,
        features.Ca,
        features.Ba,
        features.Fe
    ]
    result = predict_glass(feature_list)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
