# WeaveStream — P3 Athletics Athlete Readiness App

## Local Setup

### 1. Clone the repo
```bash
git clone <repo-url>
cd P3NewUI/my-next-app
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
pip install -r ../weavestream-backend/requirements.txt
```

### 4. Create environment files

**Frontend** — create `P3NewUI/my-next-app/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — create `P3NewUI/weavestream-backend/.env`:
```
DATABASE_URL=sqlite:///./weavestream.db
JWT_SECRET=changeme-generate-a-strong-secret
CORS_ORIGIN=http://localhost:3000
```

### 5. Set up the database
```bash
cd ../weavestream-backend
alembic upgrade head
python3 seed.py
```
This creates `weavestream.db` locally and seeds the 21 body parts and 18 workouts. Run once after cloning, and again after any new migrations are added.

### 6. Run the backend
```bash
uvicorn main:app --reload
```
Backend runs on `http://localhost:8000`.

### 7. Run the frontend
```bash
cd P3NewUI/my-next-app
npm run dev
```
Frontend runs on `http://localhost:3000`.
