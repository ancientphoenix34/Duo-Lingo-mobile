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
    lessonIds: ["es-u1-l1", "es-u1-l2"],
  },
  {
    id: "fr-u1",
    languageCode: "fr",
    title: "Basics 1",
    description: "Say hello and be polite in French.",
    order: 1,
    color: "#4D8BFF",
    lessonIds: ["fr-u1-l1"],
  },
  {
    id: "ja-u1",
    languageCode: "ja",
    title: "Basics 1",
    description: "Greet people the Japanese way.",
    order: 1,
    color: "#FF4D4F",
    lessonIds: ["ja-u1-l1"],
  },
];
