from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from models import BodyPart, Workout

BODYPARTS = [
    ("chest",      "Chest"),
    ("abs",        "Abs"),
    ("quadriceps", "Quadriceps"),
    ("biceps",     "Biceps"),
    ("deltoids",   "Shoulders"),
    ("calves",     "Calves"),
    ("triceps",    "Triceps"),
    ("obliques",   "Obliques"),
    ("forearm",    "Forearms"),
    ("neck",       "Neck"),
    ("trapezius",  "Trapezius"),
    ("adductors",  "Adductors"),
    ("tibialis",   "Tibialis"),
    ("knees",      "Knees"),
    ("hands",      "Hands"),
    ("ankles",     "Ankles"),
    ("feet",       "Feet"),
    ("upper-back", "Upper Back"),
    ("lower-back", "Lower Back"),
    ("gluteal",    "Glutes"),
    ("hamstring",  "Hamstrings"),
]

# (workout_name, bodypart_slug)
WORKOUTS = [
    ("Push-Up",           "chest"),
    ("Bench Press",       "chest"),
    ("Cable Fly",         "chest"),
    ("Squat",             "quadriceps"),
    ("Leg Press",         "quadriceps"),
    ("Lunge",             "quadriceps"),
    ("Deadlift",          "hamstring"),
    ("Romanian Deadlift", "hamstring"),
    ("Leg Curl",          "hamstring"),
    ("Hip Thrust",        "gluteal"),
    ("Glute Bridge",      "gluteal"),
    ("Sumo Squat",        "gluteal"),
    ("Shoulder Press",    "deltoids"),
    ("Lateral Raise",     "deltoids"),
    ("Front Raise",       "deltoids"),
    ("Pull-Up",           "upper-back"),
    ("Bent-Over Row",     "upper-back"),
    ("Face Pull",         "upper-back"),
]


def seed():
    db = SessionLocal()
    try:
        if db.query(BodyPart).count() > 0:
            print("Already seeded — skipping.")
            return

        bp_map = {}
        for slug, name in BODYPARTS:
            bp = BodyPart(slug=slug, Name=name, Side=None)
            db.add(bp)
            bp_map[slug] = bp

        db.flush()  # populate PKs so we can reference them

        for workout_name, bp_slug in WORKOUTS:
            w = Workout(WorkoutName=workout_name, BodyPartID=bp_map[bp_slug].BodyPartID)
            db.add(w)

        db.commit()
        print(f"Seeded {len(BODYPARTS)} BODYPART rows, {len(WORKOUTS)} WORKOUT rows")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
