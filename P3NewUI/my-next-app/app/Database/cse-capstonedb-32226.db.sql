BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "ACCOUNT" (
    "AccountID"    INTEGER,
    "Username"     TEXT NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    PRIMARY KEY("AccountID" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "BODYPART" (
    "BodyPartID"   INTEGER,
    "BodyPartName" TEXT NOT NULL,
    "Side"         TEXT,
    PRIMARY KEY("BodyPartID" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "PERSON" (
    "PersonID"    INTEGER,
    "FirstName"   TEXT NOT NULL,
    "LastName"    TEXT NOT NULL,
    "DateOfBirth" DATE,
    "AccountID"   INTEGER,
    PRIMARY KEY("PersonID" AUTOINCREMENT),
    FOREIGN KEY("AccountID") REFERENCES "ACCOUNT"("AccountID")
);

CREATE TABLE IF NOT EXISTS "WORKOUT" (
    "WorkoutID"   INTEGER,
    "WorkoutName" TEXT NOT NULL,
    "BodyPartID"  INTEGER,
    "Duration"    INTEGER,
    "Reps"        INTEGER,
    PRIMARY KEY("WorkoutID" AUTOINCREMENT),
    FOREIGN KEY("BodyPartID") REFERENCES "BODYPART"("BodyPartID")
);

CREATE TABLE IF NOT EXISTS "ATHLETE" (
    "PersonID"             INTEGER,
    "HoursSpentWorkingOut" REAL,
    "SportPlayed"          TEXT,
    "Team"                 TEXT,
    "Sex"                  TEXT,    -- Added to match your INSERT
    "Height"               INTEGER, -- Added to match your INSERT
    "Weight"               INTEGER, -- Added to match your INSERT
    PRIMARY KEY("PersonID"),
    FOREIGN KEY("PersonID") REFERENCES "PERSON"("PersonID")
);

CREATE TABLE IF NOT EXISTS "COACH" (
    "PersonID" INTEGER,
    PRIMARY KEY("PersonID"),
    FOREIGN KEY("PersonID") REFERENCES "PERSON"("PersonID")
);

CREATE TABLE IF NOT EXISTS "ATHLETE_COACH" (
    "AthletePersonID" INTEGER,
    "CoachPersonID"   INTEGER,
    PRIMARY KEY("AthletePersonID","CoachPersonID"),
    FOREIGN KEY("AthletePersonID") REFERENCES "ATHLETE"("PersonID"),
    FOREIGN KEY("CoachPersonID") REFERENCES "COACH"("PersonID")
);

CREATE TABLE IF NOT EXISTS "SORENESS_REPORT" (
    "ReportID"         INTEGER,
    "ReportDate"       DATE DEFAULT CURRENT_DATE,
    "AthletePersonID"  INTEGER,
    "ProgressScore"    INTEGER,
    "InjuryRiskScore"  INTEGER,
    PRIMARY KEY("ReportID" AUTOINCREMENT),
    FOREIGN KEY("AthletePersonID") REFERENCES "ATHLETE"("PersonID")
);

CREATE TABLE IF NOT EXISTS "SORENESS_ENTRY" (
    "EntryID"       INTEGER,
    "ReportID"      INTEGER,
    "BodyPartID"    INTEGER,
    "SorenessLevel" INTEGER,
    "ReportDate"    DATE,
    PRIMARY KEY("EntryID" AUTOINCREMENT),
    FOREIGN KEY("BodyPartID") REFERENCES "BODYPART"("BodyPartID"),
    FOREIGN KEY("ReportID") REFERENCES "SORENESS_REPORT"("ReportID")
);
INSERT INTO "ACCOUNT" ("AccountID","Username","PasswordHash") VALUES (1,'c_smith','p1'),
 (2,'c_jones','p2'),
 (3,'a_davis','p3'),
 (4,'a_miller','p4'),
 (5,'a_wilson','p5'),
 (6,'a_moore','p6'),
 (7,'a_taylor','p7');
INSERT INTO "ATHLETE" ("PersonID","HoursSpentWorkingOut","SportPlayed","Team", "Sex", "Height", "Weight") VALUES (3,10.5,'Basketball','Lions', 'Male', 74, 210),
 (4,12.0,'Soccer','Eagles', 'Male', 63, 187),
 (5,8.0,'Swimming','Sharks', 'Female', 67, 160),
 (6,15.0,'Tennis','Aces', 'Female', 55, 130),
 (7,11.0,'Basketball','Lions', 'Male', 60, 122);
INSERT INTO "ATHLETE_COACH" ("AthletePersonID","CoachPersonID") VALUES (3,1),
 (4,1),
 (5,1),
 (6,2),
 (7,1),
 (7,2);
INSERT INTO "BODYPART" ("BodyPartID","BodyPartName","Side") VALUES
 (1,'Abs','Left'),
 (2,'Abs','Right'),
 (3,'Adductors','Left'),
 (4,'Adductors','Right'),
 (5,'Adductors','N/A'),
 (6,'Ankles','Left'),
 (7,'Ankles','Right'),
 (8,'Biceps','Left'),
 (9,'Biceps','Right'),
 (10,'Biceps','N/A'),
 (11,'Calves','Left'),
 (12,'Calves','Right'),
 (13,'Chest','Left'),
 (14,'Chest','Right'),
 (15,'Chest','N/A'),
 (16,'Deltoids','Left'),
 (17,'Deltoids','Right'),
 (18,'Deltoids','N/A'),
 (19,'Feet','Left'),
 (20,'Feet','Right'),
 (21,'Forearm','Left'),
 (22,'Forearm','Right'),
 (23,'Gluteal','Left'),
 (24,'Gluteal','Right'),
 (25,'Hamstring','Left'),
 (26,'Hamstring','Right'),
 (27,'Hands','Left'),
 (28,'Hands','Right'),
 (29,'Knees','Left'),
 (30,'Knees','Right'),
 (31,'Lower Back','Left'),
 (32,'Lower Back','Right'),
 (33,'Lower Back','N/A'),
 (34,'Neck','Left'),
 (35,'Neck','Right'),
 (36,'Neck','N/A'),
 (37,'Obliques','Left'),
 (38,'Obliques','Right'),
 (39,'Quadriceps','Left'),
 (40,'Quadriceps','Right'),
 (41,'Tibialis','Left'),
 (42,'Tibialis','Right'),
 (43,'Tibialis','N/A'),
 (44,'Trapezius','Left'),
 (45,'Trapezius','Right'),
 (46,'Trapezius','N/A'),
 (47,'Triceps','Left'),
 (48,'Triceps','Right'),
 (49,'Triceps','N/A'),
 (50,'Upper Back','Left'),
 (51,'Upper Back','Right');
INSERT INTO "COACH" ("PersonID") VALUES (1),
 (2);
INSERT INTO "PERSON" ("PersonID","FirstName","LastName","DateOfBirth","AccountID") VALUES (1,'Alice','Smith','1980-01-01',1),
 (2,'Bob','Jones','1982-05-12',2),
 (3,'Charlie','Davis','2005-02-15',3),
 (4,'Diana','Miller','2004-11-20',4),
 (5,'Ethan','Wilson','2006-03-10',5),
 (6,'Fiona','Moore','2005-07-08',6),
 (7,'George','Taylor','2004-09-30',7);
INSERT INTO "SORENESS_ENTRY" ("EntryID","ReportID","BodyPartID","SorenessLevel","ReportDate") VALUES (1,1,33,4,NULL);
INSERT INTO "SORENESS_REPORT" ("ReportID","ReportDate","AthletePersonID","ProgressScore","InjuryRiskScore") VALUES (1,'2026-03-22',3,85,2);
INSERT INTO "WORKOUT" ("WorkoutID","WorkoutName","BodyPartID","Duration","Reps") VALUES (1,'Leg Extension',39,30,15),
 (2,'Squat',40,45,10),
 (3,'Bench Press',15,40,8),
 (4,'Dumbbell Curl',10,20,12),
 (5,'Overhead Press',18,25,10),
 (6,'Deadlift',33,50,5);
CREATE TABLE IF NOT EXISTS "WORKOUT_SESSION" (
    "SessionID"       INTEGER,
    "SessionDate"     DATE DEFAULT CURRENT_DATE,
    "AthletePersonID" INTEGER,
    "WorkoutID"       INTEGER,
    "Notes"           TEXT,
    PRIMARY KEY("SessionID" AUTOINCREMENT),
    FOREIGN KEY("AthletePersonID") REFERENCES "ATHLETE"("PersonID"),
    FOREIGN KEY("WorkoutID") REFERENCES "WORKOUT"("WorkoutID")
);
INSERT INTO "WORKOUT_SESSION" ("SessionID","SessionDate","AthletePersonID","WorkoutID","Notes") VALUES (1,'2026-03-22',3,2,'Felt strong today.');
COMMIT;
