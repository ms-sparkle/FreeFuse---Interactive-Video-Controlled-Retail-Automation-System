from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os

# Import the Anny model (ensure you have it installed per their docs)
# import anny 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. New Payload Shape (Matches your sliders!)
class BiometricPayload(BaseModel):
    height_cm: float
    estimated_bf_percent: float
    muscle_mass_index: float

@app.post("/api/generate-mesh")
async def generate_mesh(payload: BiometricPayload):
    try:
        print(f"✅ Received parameters: Height: {payload.height_cm}, BF: {payload.estimated_bf_percent}, Muscle: {payload.muscle_mass_index}")
        
        # 2. RUN THE ACTUAL ANNY MODEL HERE
        # (Check Anny's exact documentation for their semantic generation syntax)
        """
        model = anny.AnnyModel()
        
        # Pass the slider values into the parametric model
        mesh_data = model.generate(
            height=payload.height_cm,
            body_fat=payload.estimated_bf_percent,
            muscle=payload.muscle_mass_index
        )
        
        # Save it as a .glb (GLTF) file - the industry standard for web 3D
        output_filename = "generated_twin.glb"
        model.export(mesh_data, f"../my-next-app/public/{output_filename}")
        """
        
        # Simulating the Anny processing time for now
        await asyncio.sleep(2)
        
        return {
            "status": "success",
            "message": "Mesh generated successfully",
            # We tell Next.js exactly what file to load
            "mesh_url": "/generated_twin.glb" 
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "WeaveStream API is running."}