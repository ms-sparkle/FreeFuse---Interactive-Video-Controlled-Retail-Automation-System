import time
import os
import shutil
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Initialize FastAPI
app = FastAPI()

# 2. CORS Setup (Crucial for Next.js communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the path to your Next.js public folder
# Adjust "my-next-app" if your Next.js folder is named differently
NEXT_PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-next-app", "public"))

class BiometricPayload(BaseModel):
    height_cm: float
    estimated_bf_percent: float
    muscle_mass_index: float

@app.post("/api/generate-mesh")
async def generate_mesh(payload: BiometricPayload):
    try:
        # Create a unique filename using a timestamp to bypass browser caching
        timestamp = int(time.time())
        filename = f"generated_twin_{timestamp}.glb"
        filepath = os.path.join(NEXT_PUBLIC_DIR, filename)
        
        print(f"Generating new mesh: {filename}...")
        
        # --- AI GENERATION SIMULATION BLOCK ---
        await asyncio.sleep(2) # Simulate processing time
        
        # Look for a base model to copy to simulate a newly generated file
        base_model_path = os.path.join(NEXT_PUBLIC_DIR, "base_model.glb") 
        fallback_path = os.path.join(NEXT_PUBLIC_DIR, "generated_twin.glb")
        
        if os.path.exists(base_model_path):
            shutil.copy(base_model_path, filepath)
        elif os.path.exists(fallback_path):
            shutil.copy(fallback_path, filepath)
        else:
            raise Exception("No base .glb file found in Next.js public folder to simulate generation.")
        # ----------------------------------------

        print(f"Successfully saved to {filepath}")

        # Return the exact URL path that Next.js needs to fetch
        return {
            "status": "success",
            "mesh_url": f"/{filename}"
        }

    except Exception as e:
        print(f"Error generating mesh: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "WeaveStream API is running."}