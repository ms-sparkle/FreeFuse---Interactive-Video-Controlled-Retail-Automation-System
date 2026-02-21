# Athlete Performance Tracking System  
## Entity Relationship Diagram

This document contains the ER diagram for the commercial athlete tracking system.

---

```mermaid
erDiagram

    USER {
        int UserID PK
        string Username
        string PasswordHash
        string FirstName
        string LastName
        int Age
        float HoursSpentWorkingOut
        float InjuryRiskScore
        float ProgressScore
        string SportPlayed
    }

    SORENESSREPORT {
        int ReportID PK
        date ReportDate
        int UserID FK
    }

    SORENESSENTRY {
        int EntryID PK
        int ReportID FK
        int BodyPartID FK
        int SorenessLevel
    }

    BODYPART {
        int BodyPartID PK
        string Name
        string Side
    }

    TRAININGPLAN {
        int PlanID PK
        string PlanName
        int UserID FK
    }

    WORKOUT {
        int WorkoutID PK
        string WorkoutName
    }

    TRAININGPLAN_WORKOUT {
        int PlanID FK
        int WorkoutID FK
    }

    WORKOUTSESSION {
        int SessionID PK
        date SessionDate
        int UserID FK
        int WorkoutID FK
    }

    USER ||--o{ SORENESSREPORT : submits
    SORENESSREPORT ||--o{ SORENESSENTRY : contains
    BODYPART ||--o{ SORENESSENTRY : tracked_for

    USER ||--o{ TRAININGPLAN : owns
    TRAININGPLAN ||--o{ TRAININGPLAN_WORKOUT : includes
    WORKOUT ||--o{ TRAININGPLAN_WORKOUT : assigned_to

    USER ||--o{ WORKOUTSESSION : completes
    WORKOUT ||--o{ WORKOUTSESSION : performed_as
```

---

## Notes

- The system is designed for a commercial athlete tracking platform.
- Coaches are not modeled as entities; insights are system-generated.
- Workouts and training plans use a many-to-many relationship via a junction table.
- The schema follows Third Normal Form (3NF).
