# WEAVESTREAM — System Diagram

```mermaid
graph TD
    subgraph Client["Browser (Client)"]
        UI["Next.js Pages\n/ · /login · /register\n/check-in · /player-dashboard\n/coach · /active-workout\n/workout-presets"]
        COMP["Components\nBodyMap · BodyMapDisplay\nWorkoutPresets · TrainingPlanModal\nRestrictWorkouts · SearchBar"]
    end

    subgraph Middleware["Edge Middleware"]
        MW["middleware.ts\nJWT guard\n→ protects /check-in\n→ protects /player-dashboard\n→ protects /coach"]
    end

    subgraph API["Next.js API Routes (Node.js)"]
        AUTH["/api/auth/*\nlogin · logout\nregister · session\nchange-password"]
        CHECKIN["/api/check-in\nGET today's soreness\nPOST soreness report"]
        COACH_API["/api/coach/*\nathletes · training-plan\nworkout-bans · invite/remove"]
        PLAYER_API["/api/player/[id]/*\nprofile · session-history\nsoreness-history · preset\ninvite/remove-coach"]
        MISC_API["/api/workout-session\n/api/workouts-json\n/api/notes\n/api/coach-notes"]
    end

    subgraph DataLayer["Data Layer"]
        DB[("SQLite\ndata/capstone.db\n─────────────\nACCOUNT · PERSON\nATHLETE · COACH\nATHLETE_COACH\nSORENESS_REPORT\nSORENESS_ENTRY\nTRAINING_PLAN\nWORKOUT_SESSION\nWORKOUT_BAN\nCOACH_NOTE")]
        JSON["data/workouts.json\n(static workout definitions)"]
        SEED["app/Database/\ncse-capstonedb-32226.db.sql\n(seed schema)"]
    end

    subgraph Auth["Auth System"]
        JWT["JWT (jose / HS256)\nHttpOnly cookie: 'session'\n8-hour expiry\nSESSION_SECRET env var"]
        BCRYPT["bcryptjs\npassword hashing"]
    end

    UI -->|"HTTP requests"| MW
    MW -->|"verified → allow"| API
    MW -->|"fail → redirect"| UI
    AUTH --> JWT
    AUTH --> BCRYPT
    CHECKIN --> DB
    COACH_API --> DB
    PLAYER_API --> DB
    MISC_API --> DB
    MISC_API --> JSON
    DB -.->|"seeded on first run"| SEED
    API -->|"JSON responses"| UI
    COMP -.->|"used by"| UI
```

## Key Architectural Decisions

| Concern | Solution |
|---|---|
| Auth | Custom JWT via `jose`; no NextAuth |
| Database | Embedded SQLite (`better-sqlite3`, WAL mode) — no external DB |
| Route protection | Edge middleware JWT verification |
| Styling | Tailwind CSS v4 |
| 3D / SVG bodies | `@react-three/fiber` + inline SVG wrappers |
| Charts | `recharts` |
| Password security | `bcryptjs` |
