# Athlete Performance Tracking System  
## Entity Relationship Diagram

This document contains the ER diagram for the commercial athlete tracking system.

---

```mermaid
erDiagram

    ACCOUNT {
        int AccountID PK
        string Username
        string PasswordHash
    }

    PERSON {
        int PersonID PK
        string FirstName
        string LastName
        int AccountID FK
    }

    ATHLETE {
        int PersonID PK
        int Age
        float HoursSpentWorkingOut
        float InjuryRiskScore
        float ProgressScore
        string SportPlayed
        string Team
        int CoachID FK
    }

    COACH {
        int PersonID PK
    }

    SORENESSREPORT {
        int ReportID PK
        date ReportDate
        int AthleteID FK
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
        int CoachID FK
        int AthleteID FK
    }

    WORKOUT {
        int WorkoutID PK
        string WorkoutName
    }

    WORKOUTSESSION {
        int SessionID PK
        date SessionDate
        int AthleteID FK
        int WorkoutID FK
    }

    COACHOBSERVATION {
        int ObservationID PK
        date ObservationDate
        string Notes
        int CoachID FK
        int AthleteID FK
    }

    ACCOUNT ||--|| PERSON : authenticates
    PERSON ||--|| ATHLETE : is
    PERSON ||--|| COACH : is

    COACH ||--o{ ATHLETE : coaches
    ATHLETE ||--o{ SORENESSREPORT : submits
    SORENESSREPORT ||--o{ SORENESSENTRY : contains
    BODYPART ||--o{ SORENESSENTRY : tracked_for

    COACH ||--o{ TRAININGPLAN : creates
    ATHLETE ||--o{ TRAININGPLAN : assigned_to
    TRAININGPLAN ||--o{ WORKOUT : includes
    WORKOUT ||--o{ WORKOUTSESSION : performed_as
    ATHLETE ||--o{ WORKOUTSESSION : completes

    COACH ||--o{ COACHOBSERVATION : records
    ATHLETE ||--o{ COACHOBSERVATION : receives
```

---

## Relational Schema
ACCOUNT (AccountID [PK], Username [Unique], PasswordHash) 
PERSON (PersonID [PK], FirstName, LastName, DateOfBirth, AccountID [FK]) 
ATHLETE (PersonID [PK, FK to Person], HoursSpentWorkingOut, SportPlayed, Team) 
COACH (PersonID [PK, FK to Person]) 
BODYPART (BodyPartID [PK], Name, Side) 
WORKOUT (WorkoutID [PK], WorkoutName, BodyPartID [FK]) 
ATHLETE_COACH (AthletePersonID [PK, FK], CoachPersonID [PK, FK], StartDate [PK], EndDate) 
SORENESS_REPORT (ReportID [PK], ReportDate, AthletePersonID [FK]) 
SORENESS_ENTRY (EntryID [PK], ReportID [FK], BodyPartID [FK], SorenessLevel) 
TRAINING_PLAN (PlanID [PK], PlanName, CoachPersonID [FK], AthletePersonID [FK]) 
PLAN_WORKOUT (PlanID [PK, FK for Training_Plan], WorkoutID [PK, FK for Workout], OrderIndex, Sets, Reps, DurationMinutes, Notes) 
WORKOUT_SESSION (SessionID [PK], SessionDate, AthletePersonID [FK], WorkoutID [FK], Notes) 
COACH_OBSERVATION (ObservationID [PK], ObservationDate, Notes, CoachPersonID [FK], AthletePersonID [FK]) 
ATHLETE_SCORE_HISTORY (ScoreID [PK], AthletePersonID [FK], ScoreDate, InjuryRiskScore, ProgressScore, ModelVersion, Notes) 

## Notes

- The system is designed for a commercial athlete tracking platform.
- Workouts and training plans use a many-to-many relationship via a junction table.
- The schema follows Third Normal Form (3NF).
