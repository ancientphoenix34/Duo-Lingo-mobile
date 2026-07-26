import type { Unit } from "@/types/learning";

// Lesson content for these ids lives in `data/lessons.ts`.
export const units: Unit[] = [
  {
    id: "es-u1",
    languageCode: "es",
    title: "Basics 1",
    description: "Greetings and introducing your family.",
    order: 1,
    color: "#FF9600",
    lessonIds: ["es-u1-l1", "es-u1-l2", "es-u1-l3", "es-u1-l4", "es-u1-l5", "es-u1-l6"],
  },
  {
    id: "fr-u1",
    languageCode: "fr",
    title: "Basics 1",
    description: "Say hello and be polite in French.",
    order: 1,
    color: "#4D8BFF",
    lessonIds: ["fr-u1-l1", "fr-u1-l2", "fr-u1-l3", "fr-u1-l4", "fr-u1-l5", "fr-u1-l6"],
  },
  {
    id: "ja-u1",
    languageCode: "ja",
    title: "Basics 1",
    description: "Greet people the Japanese way.",
    order: 1,
    color: "#FF4D4F",
    lessonIds: ["ja-u1-l1", "ja-u1-l2", "ja-u1-l3", "ja-u1-l4", "ja-u1-l5", "ja-u1-l6"],
  },
];
