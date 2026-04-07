from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float, Date
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from passlib.hash import bcrypt
from datetime import date

app = FastAPI()


# DATABASE SETUP

engine = create_engine(
    "sqlite:///./weavestream.db",
    connect_args={"check_same_thread": False}
)

Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

# MODELS


class Account(Base):
    __tablename__ = "account"

    account_id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password_hash = Column(String)

    person = relationship("Person", back_populates="account", uselist=False)


class Person(Base):
    __tablename__ = "person"

    person_id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    account_id = Column(Integer, ForeignKey("account.account_id"), unique=True)

    account = relationship("Account", back_populates="person")
    athlete = relationship("Athlete", back_populates="person", uselist=False)
    coach = relationship("Coach", back_populates="person", uselist=False)


class Coach(Base):
    __tablename__ = "coach"

    person_id = Column(Integer, ForeignKey("person.person_id"), primary_key=True)

    person = relationship("Person", back_populates="coach")
    athletes = relationship("Athlete", back_populates="coach")


class Athlete(Base):
    __tablename__ = "athlete"

    person_id = Column(Integer, ForeignKey("person.person_id"), primary_key=True)
    age = Column(Integer)
    sport_played = Column(String)
    coach_id = Column(Integer, ForeignKey("coach.person_id"))

    person = relationship("Person", back_populates="athlete")
    coach = relationship("Coach", back_populates="athletes")
    soreness_reports = relationship("SorenessReport", back_populates="athlete")
    biometric_scans = relationship("BiometricScan", backref="athlete")


class BiometricScan(Base):
    __tablename__ = "biometricscan"

    scan_id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey("athlete.person_id"))
    scan_date = Column(Date)
    body_fat = Column(Float)
    muscle_mass = Column(Float)


class SorenessReport(Base):
    __tablename__ = "sorenessreport"

    report_id = Column(Integer, primary_key=True)
    report_date = Column(Date)
    athlete_id = Column(Integer, ForeignKey("athlete.person_id"))

    athlete = relationship("Athlete", back_populates="soreness_reports")
    entries = relationship("SorenessEntry", back_populates="report")


class BodyPart(Base):
    __tablename__ = "bodypart"

    body_part_id = Column(Integer, primary_key=True)
    name = Column(String)
    side = Column(String)


class SorenessEntry(Base):
    __tablename__ = "sorenessentry"

    entry_id = Column(Integer, primary_key=True)
    report_id = Column(Integer, ForeignKey("sorenessreport.report_id"))
    body_part_id = Column(Integer, ForeignKey("bodypart.body_part_id"))
    soreness_level = Column(Integer)

    report = relationship("SorenessReport", back_populates="entries")


# Create tables
Base.metadata.create_all(bind=engine)


# REQUEST MODELS


class RegisterCoachRequest(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str


class RegisterAthleteRequest(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    age: int
    sport: str
    coach_id: int


class LoginRequest(BaseModel):
    username: str
    password: str


class SorenessRequest(BaseModel):
    athlete_id: int
    body_part_id: int
    soreness_level: int


class BiometricScanRequest(BaseModel):
    athlete_id: int
    body_fat: float
    muscle_mass: float



# ROUTES


@app.get("/")
def root():
    return {"message": "Backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}


# REGISTER COACH

@app.post("/register/coach")
def register_coach(data: RegisterCoachRequest):
    db = SessionLocal()
    try:
        account = Account(
            username=data.username,
            password_hash=bcrypt.hash(data.password)
        )
        db.add(account)
        db.commit()
        db.refresh(account)

        person = Person(
            first_name=data.first_name,
            last_name=data.last_name,
            account_id=account.account_id
        )
        db.add(person)
        db.commit()
        db.refresh(person)

        coach = Coach(person_id=person.person_id)
        db.add(coach)
        db.commit()

        return {"message": "Coach created"}

    finally:
        db.close()


# REGISTER ATHLETE

@app.post("/register/athlete")
def register_athlete(data: RegisterAthleteRequest):
    db = SessionLocal()
    try:
        account = Account(
            username=data.username,
            password_hash=bcrypt.hash(data.password)
        )
        db.add(account)
        db.commit()
        db.refresh(account)

        person = Person(
            first_name=data.first_name,
            last_name=data.last_name,
            account_id=account.account_id
        )
        db.add(person)
        db.commit()
        db.refresh(person)

        athlete = Athlete(
            person_id=person.person_id,
            age=data.age,
            sport_played=data.sport,
            coach_id=data.coach_id
        )
        db.add(athlete)
        db.commit()

        return {"message": "Athlete created"}

    finally:
        db.close()


# LOGIN

@app.post("/login")
def login(data: LoginRequest):
    db = SessionLocal()
    try:
        account = db.query(Account).filter(Account.username == data.username).first()

        if not account:
            raise HTTPException(status_code=400, detail="Invalid username")

        if not bcrypt.verify(data.password, account.password_hash):
            raise HTTPException(status_code=400, detail="Invalid password")

        return {
            "message": "Login successful",
            "account_id": account.account_id
        }

    finally:
        db.close()

# BIOMETRIC SCAN

@app.post("/biometric")
def add_biometric_scan(data: BiometricScanRequest):
    db = SessionLocal()
    try:
        if data.body_fat < 0 or data.body_fat > 100:
            raise HTTPException(status_code=400, detail="Invalid body fat %")

        if data.muscle_mass < 0:
            raise HTTPException(status_code=400, detail="Invalid muscle mass")

        scan = BiometricScan(
            athlete_id=data.athlete_id,
            scan_date=date.today(),
            body_fat=data.body_fat,
            muscle_mass=data.muscle_mass
        )
        db.add(scan)
        db.commit()

        return {"message": "Scan saved"}

    finally:
        db.close()


# GET BIOMETRICS (Charts)

@app.get("/athlete/{athlete_id}/biometrics")
def get_biometrics(athlete_id: int):
    db = SessionLocal()
    try:
        scans = db.query(BiometricScan)\
            .filter(BiometricScan.athlete_id == athlete_id)\
            .order_by(BiometricScan.scan_date)\
            .all()

        return [
            {
                "date": str(s.scan_date),
                "body_fat": s.body_fat,
                "muscle_mass": s.muscle_mass
            }
            for s in scans
        ]

    finally:
        db.close()


# COMPARE SCANS (Task 5)

@app.get("/athlete/{athlete_id}/compare")
def compare_scans(athlete_id: int):
    db = SessionLocal()
    try:
        scans = db.query(BiometricScan)\
            .filter(BiometricScan.athlete_id == athlete_id)\
            .order_by(BiometricScan.scan_date)\
            .all()

        if len(scans) < 2:
            raise HTTPException(status_code=400, detail="Not enough data")

        first = scans[0]
        last = scans[-1]

        return {
            "start_date": str(first.scan_date),
            "end_date": str(last.scan_date),
            "body_fat_change": last.body_fat - first.body_fat,
            "muscle_mass_change": last.muscle_mass - first.muscle_mass
        }

    finally:
        db.close()


# REPORT SORENESS

@app.post("/soreness")
def report_soreness(data: SorenessRequest):
    db = SessionLocal()
    try:
        report = SorenessReport(
            report_date=date.today(),
            athlete_id=data.athlete_id
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        entry = SorenessEntry(
            report_id=report.report_id,
            body_part_id=data.body_part_id,
            soreness_level=data.soreness_level
        )
        db.add(entry)
        db.commit()

        return {"message": "Soreness recorded"}

    finally:
        db.close()

# COACH VIEW ATHLETES
@app.get("/coach/{coach_id}/athletes")
def get_athletes(coach_id: int):
    db = SessionLocal()
    try:
        athletes = db.query(Athlete).filter(Athlete.coach_id == coach_id).all()

        return [
            {
                "athlete_id": a.person_id,
                "age": a.age,
                "sport": a.sport_played
            }
            for a in athletes
        ]

    finally:
        db.close()