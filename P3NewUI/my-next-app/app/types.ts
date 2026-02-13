// Type definitions for body parts
export type BodyPart = {
  slug: string;
  color: string;
  path: {
    left?: string[];
    right?: string[];
    common?: string[];
  };
  hitPath?: {
    left?: string[];
    right?: string[];
    common?: string[];
  };
};

export type Slug =
  | "abs"
  | "adductors"
  | "ankles"
  | "biceps"
  | "calves"
  | "chest"
  | "deltoids"
  | "feet"
  | "forearm"
  | "gluteal"
  | "hamstring"
  | "hands"
  | "hair"
  | "head"
  | "knees"
  | "lower-back"
  | "neck"
  | "obliques"
  | "quadriceps"
  | "tibialis"
  | "trapezius"
  | "triceps"
  | "upper-back";
