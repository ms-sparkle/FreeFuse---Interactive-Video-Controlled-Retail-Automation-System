# Athlete Performance Tracking System  
## Entity Relationship Diagram

This document contains the ER diagram for the commercial athlete tracking system.

---

<img width="2385" height="2520" alt="Capstone ER Diagram (1)" src="https://github.com/user-attachments/assets/577e84ba-e78e-49b9-8628-844265a012c5" />


---

## Relational Schema
- ACCOUNT (AccountID [PK], Username [Unique], PasswordHash) 
- PERSON (PersonID [PK], FirstName, LastName, DateOfBirth, AccountID [FK]) 
- ATHLETE (PersonID [PK, FK to Person], HoursSpentWorkingOut, SportPlayed, Team, Sex, Weight, Height)
- COACH (PersonID [PK, FK to Person])
- BODYPART (BodyPartID [PK], BodyPartName, Side)
- WORKOUT (WorkoutID [PK], WorkoutName, BodyPartID [FK], Duration, Reps)
- ATHLETE_COACH (AthletePersonID [PK, FK], CoachPersonID [PK, FK])
- SORENESS_REPORT (ReportID [PK], ReportDate, AthletePersonID [FK], ProgressScore, InjuryRiskScore)
- SORENESS_ENTRY (EntryID [PK], ReportID [FK], BodyPartID [FK], SorenessLevel, ReportDate)
- TRAINING_PLAN (PlanID [PK], PlanName, CoachPersonID [FK], AthletePersonID [FK], WorkoutID [FK], Notes)
- WORKOUT_SESSION (SessionID [PK], SessionDate, AthletePersonID [FK], WorkoutID [FK], Notes)
- COACH_OBSERVATION (ObservationID [PK], ObservationDate, Notes, CoachPersonID [FK], AthletePersonID [FK])
- ATHLETE_SCORE_HISTORY (ScoreID [PK], AthletePersonID [FK], ScoreDate, InjuryRiskScore, ProgressScore) 

## Notes

- The system is designed for a commercial athlete tracking platform.
- Workouts and training plans use a many-to-many relationship via a junction table.
- The schema follows Third Normal Form (3NF).
