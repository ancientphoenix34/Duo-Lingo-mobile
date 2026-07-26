// Shared types for the hardcoded learning content system (languages, units,
// lessons, activities). Keep these in sync with the data files in `data/`.

// Keep in sync with the `code` values in `data/languages.ts`.
export type LanguageCode = "es" | "fr" | "ja" | "ko" | "de" | "zh";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  color: string;
  /** Display string for the learner count shown on the language selection screen, e.g. "28.4M". */
  learners: string;
}

export interface VocabularyItem {
  id: string;
  term: string;
  translation: string;
  pronunciation?: string;
  /** Text the AI teacher should say aloud to demonstrate this word. */
  audioPrompt?: string;
}

export interface PhraseItem {
  id: string;
  phrase: string;
  translation: string;
  context?: string;
}

export type ActivityType =
  | "multiple-choice"
  | "translate"
  | "listen-and-select"
  | "fill-in-the-blank"
  | "match-pairs"
  | "speak";

export interface ActivityOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface Activity {
  id: string;
  type: ActivityType;
  prompt: string;
  /** Used by multiple-choice / listen-and-select / match-pairs activities. */
  options?: ActivityOption[];
  /** Used by translate / fill-in-the-blank activities. */
  correctAnswer?: string;
  /** Links this activity back to the vocabulary item it reinforces. */
  vocabularyId?: string;
}

export interface LessonGoal {
  id: string;
  description: string;
}

/**
 * Prompt config for the AI video/audio teacher (Stream Vision Agent) that
 * runs a lesson session. Only text is defined here today; the backend
 * turns this into an actual agent session.
 */
export interface AITeacherPrompt {
  systemPrompt: string;
  greeting: string;
  focusVocabularyIds: string[];
}

export interface Lesson {
  id: string;
  unitId: string;
  languageCode: LanguageCode;
  title: string;
  description: string;
  order: number;
  xpReward: number;
  /** Illustration for this lesson's hero banner and its card badge on the lessons screen. */
  image?: string;
  goals: LessonGoal[];
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  activities: Activity[];
  aiTeacherPrompt: AITeacherPrompt;
}

export interface Unit {
  id: string;
  languageCode: LanguageCode;
  title: string;
  description: string;
  order: number;
  color: string;
  /** Ordered lesson ids belonging to this unit; lessons live in `data/lessons.ts`. */
  lessonIds: string[];
}
