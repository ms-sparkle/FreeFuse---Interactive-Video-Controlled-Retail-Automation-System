from sqlalchemy import (
    Column, Integer, String, Float, Date, Text,
    ForeignKey, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from database import Base


# ─── Phase 1: Full ORM with relationships ────────────────────────────────────

class Account(Base):
    __tablename__ = "ACCOUNT"

    AccountID = Column(Integer, primary_key=True, autoincrement=True)
    Username = Column(String, unique=True, nullable=False)
    PasswordHash = Column(String, nullable=False)

    person = relationship("Person", back_populates="account", uselist=False)


class Person(Base):
    __tablename__ = "PERSON"

    PersonID = Column(Integer, primary_key=True, autoincrement=True)
    FirstName = Column(String)
    LastName = Column(String)
    DateOfBirth = Column(Date)
    AccountID = Column(Integer, ForeignKey("ACCOUNT.AccountID"), unique=True)

    account = relationship("Account", back_populates="person")
    athlete = relationship("Athlete", back_populates="person", uselist=False)
    coach = relationship("Coach", back_populates="person", uselist=False)


class Athlete(Base):
    __tablename__ = "ATHLETE"

    PersonID = Column(Integer, ForeignKey("PERSON.PersonID", ondelete="CASCADE"), primary_key=True)
    HoursSpentWorkingOut = Column(Float)
    SportPlayed = Column(String)
    Team = Column(String)

    person = relationship("Person", back_populates="athlete")
    soreness_reports = relationship("SorenessReport", back_populates="athlete")
    training_plans = relationship("TrainingPlan", back_populates="athlete")
    score_history = relationship("AthleteScoreHistory", back_populates="athlete")


class BodyPart(Base):
    __tablename__ = "BODYPART"

    BodyPartID = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String, unique=True, nullable=False)
    Name = Column(String, nullable=False)
    Side = Column(String)

    __table_args__ = (UniqueConstraint("Name", "Side", name="uq_bodypart_name_side"),)

    workouts = relationship("Workout", back_populates="body_part")
    soreness_entries = relationship("SorenessEntry", back_populates="body_part")


class Workout(Base):
    __tablename__ = "WORKOUT"

    WorkoutID = Column(Integer, primary_key=True, autoincrement=True)
    WorkoutName = Column(String, nullable=False)
    BodyPartID = Column(Integer, ForeignKey("BODYPART.BodyPartID"))

    body_part = relationship("BodyPart", back_populates="workouts")
    plan_workouts = relationship("PlanWorkout", back_populates="workout")


class SorenessReport(Base):
    __tablename__ = "SORENESS_REPORT"

    ReportID = Column(Integer, primary_key=True, autoincrement=True)
    ReportDate = Column(Date, nullable=False)
    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"))

    athlete = relationship("Athlete", back_populates="soreness_reports")
    entries = relationship("SorenessEntry", back_populates="report")


class SorenessEntry(Base):
    __tablename__ = "SORENESS_ENTRY"

    EntryID = Column(Integer, primary_key=True, autoincrement=True)
    ReportID = Column(Integer, ForeignKey("SORENESS_REPORT.ReportID"))
    BodyPartID = Column(Integer, ForeignKey("BODYPART.BodyPartID"))
    SorenessLevel = Column(Integer)

    __table_args__ = (
        UniqueConstraint("ReportID", "BodyPartID", name="uq_entry_report_bodypart"),
        CheckConstraint("SorenessLevel BETWEEN 0 AND 10", name="chk_soreness_level"),
    )

    report = relationship("SorenessReport", back_populates="entries")
    body_part = relationship("BodyPart", back_populates="soreness_entries")


class TrainingPlan(Base):
    __tablename__ = "TRAINING_PLAN"

    PlanID = Column(Integer, primary_key=True, autoincrement=True)
    PlanName = Column(String, nullable=False)
    CoachPersonID = Column(Integer, ForeignKey("COACH.PersonID"), nullable=True)
    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"), nullable=True)

    athlete = relationship("Athlete", back_populates="training_plans")
    plan_workouts = relationship("PlanWorkout", back_populates="plan")


class PlanWorkout(Base):
    __tablename__ = "PLAN_WORKOUT"

    PlanID = Column(Integer, ForeignKey("TRAINING_PLAN.PlanID"), primary_key=True)
    WorkoutID = Column(Integer, ForeignKey("WORKOUT.WorkoutID"), primary_key=True)
    OrderIndex = Column(Integer)
    Sets = Column(Integer)
    Reps = Column(Integer)
    DurationMinutes = Column(Integer)
    Notes = Column(Text)

    plan = relationship("TrainingPlan", back_populates="plan_workouts")
    workout = relationship("Workout", back_populates="plan_workouts")


class AthleteScoreHistory(Base):
    __tablename__ = "ATHLETE_SCORE_HISTORY"

    ScoreID = Column(Integer, primary_key=True, autoincrement=True)
    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"))
    ScoreDate = Column(Date, nullable=False)
    InjuryRiskScore = Column(Float)
    ProgressScore = Column(Float)
    ModelVersion = Column(String)
    Notes = Column(Text)

    athlete = relationship("Athlete", back_populates="score_history")


# ─── Phase 2: Stub classes (no relationships) ────────────────────────────────

class Coach(Base):
    __tablename__ = "COACH"

    PersonID = Column(Integer, ForeignKey("PERSON.PersonID"), primary_key=True)

    person = relationship("Person", back_populates="coach")


class AthleteCoach(Base):
    __tablename__ = "ATHLETE_COACH"

    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"), primary_key=True)
    CoachPersonID = Column(Integer, ForeignKey("COACH.PersonID"), primary_key=True)
    StartDate = Column(Date, primary_key=True)
    EndDate = Column(Date)


class WorkoutSession(Base):
    __tablename__ = "WORKOUT_SESSION"

    SessionID = Column(Integer, primary_key=True, autoincrement=True)
    SessionDate = Column(Date)
    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"))
    WorkoutID = Column(Integer, ForeignKey("WORKOUT.WorkoutID"))
    Notes = Column(Text)


class CoachObservation(Base):
    __tablename__ = "COACH_OBSERVATION"

    ObservationID = Column(Integer, primary_key=True, autoincrement=True)
    ObservationDate = Column(Date)
    Notes = Column(Text)
    CoachPersonID = Column(Integer, ForeignKey("COACH.PersonID"))
    AthletePersonID = Column(Integer, ForeignKey("ATHLETE.PersonID"))
