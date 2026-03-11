# 1. Use an official PyTorch image with CUDA support for GPU acceleration
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy just the requirements first (this caches the heavy downloads)
COPY requirements.txt .

# 4. Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your FastAPI backend into the container
COPY . .

# 6. Expose the port Azure will use to talk to FastAPI
EXPOSE 8000

# 7. Start the Uvicorn server (0.0.0.0 is required for Docker/Azure routing)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]