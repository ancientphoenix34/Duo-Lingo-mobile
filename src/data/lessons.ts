import type { Lesson } from "@/types/learning";

export const lessons: Lesson[] = [
  // ---------------------------------------------------------------------
  // Spanish
  // ---------------------------------------------------------------------
  {
    id: "es-u1-l1",
    unitId: "es-u1",
    languageCode: "es",
    title: "Greetings",
    description: "Say hello, be polite, and say goodbye in Spanish.",
    order: 1,
    xpReward: 10,
    goals: [
      { id: "es-u1-l1-g1", description: "Greet someone in Spanish" },
      { id: "es-u1-l1-g2", description: "Say please and thank you" },
      { id: "es-u1-l1-g3", description: "Say goodbye politely" },
    ],
    vocabulary: [
      {
        id: "es-u1-l1-v1",
        term: "Hola",
        translation: "Hello",
        pronunciation: "OH-lah",
        audioPrompt: "Hola",
      },
      {
        id: "es-u1-l1-v2",
        term: "Buenos días",
        translation: "Good morning",
        pronunciation: "BWEH-nos DEE-ahs",
        audioPrompt: "Buenos días",
      },
      {
        id: "es-u1-l1-v3",
        term: "Buenas tardes",
        translation: "Good afternoon",
        pronunciation: "BWEH-nahs TAR-dehs",
        audioPrompt: "Buenas tardes",
      },
      {
        id: "es-u1-l1-v4",
        term: "Adiós",
        translation: "Goodbye",
        pronunciation: "ah-DYOHS",
        audioPrompt: "Adiós",
      },
      {
        id: "es-u1-l1-v5",
        term: "Por favor",
        translation: "Please",
        pronunciation: "por fah-VOR",
        audioPrompt: "Por favor",
      },
      {
        id: "es-u1-l1-v6",
        term: "Gracias",
        translation: "Thank you",
        pronunciation: "GRAH-syahs",
        audioPrompt: "Gracias",
      },
    ],
    phrases: [
      {
        id: "es-u1-l1-p1",
        phrase: "¿Cómo estás?",
        translation: "How are you?",
        context: "Casual greeting between friends",
      },
      {
        id: "es-u1-l1-p2",
        phrase: "Mucho gusto",
        translation: "Nice to meet you",
        context: "When meeting someone for the first time",
      },
    ],
    activities: [
      {
        id: "es-u1-l1-a1",
        type: "multiple-choice",
        prompt: "How do you say 'Hello' in Spanish?",
        vocabularyId: "es-u1-l1-v1",
        options: [
          { id: "es-u1-l1-a1-o1", label: "Hola", isCorrect: true },
          { id: "es-u1-l1-a1-o2", label: "Adiós", isCorrect: false },
          { id: "es-u1-l1-a1-o3", label: "Gracias", isCorrect: false },
          { id: "es-u1-l1-a1-o4", label: "Por favor", isCorrect: false },
        ],
      },
      {
        id: "es-u1-l1-a2",
        type: "translate",
        prompt: "Translate to Spanish: Good morning",
        vocabularyId: "es-u1-l1-v2",
        correctAnswer: "Buenos días",
      },
      {
        id: "es-u1-l1-a3",
        type: "listen-and-select",
        prompt: "Listen and select what you hear",
        vocabularyId: "es-u1-l1-v1",
        options: [
          { id: "es-u1-l1-a3-o1", label: "Adiós", isCorrect: false },
          { id: "es-u1-l1-a3-o2", label: "Hola", isCorrect: true },
          { id: "es-u1-l1-a3-o3", label: "Gracias", isCorrect: false },
          { id: "es-u1-l1-a3-o4", label: "Por favor", isCorrect: false },
        ],
      },
      {
        id: "es-u1-l1-a4",
        type: "fill-in-the-blank",
        prompt: "Complete the phrase: ¿Cómo ___?",
        correctAnswer: "estás",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        "You are a warm, patient Spanish teacher hosting a live video lesson with a complete beginner. Speak slowly, repeat key words, and mix simple Spanish with English translations. Stay focused only on the greetings and courtesy vocabulary and phrases for this lesson. Gently correct pronunciation and praise effort often.",
      greeting:
        "¡Hola! Soy tu profesora de español. Hoy vamos a aprender a saludar. ¿Listo?",
      focusVocabularyIds: [
        "es-u1-l1-v1",
        "es-u1-l1-v2",
        "es-u1-l1-v4",
        "es-u1-l1-v5",
        "es-u1-l1-v6",
      ],
    },
  },
  {
    id: "es-u1-l2",
    unitId: "es-u1",
    languageCode: "es",
    title: "Family",
    description: "Talk about your family members in Spanish.",
    order: 2,
    xpReward: 10,
    goals: [
      { id: "es-u1-l2-g1", description: "Name close family members" },
      { id: "es-u1-l2-g2", description: "Introduce your family" },
    ],
    vocabulary: [
      {
        id: "es-u1-l2-v1",
        term: "La familia",
        translation: "The family",
        pronunciation: "lah fah-MEE-lyah",
        audioPrompt: "La familia",
      },
      {
        id: "es-u1-l2-v2",
        term: "La madre",
        translation: "The mother",
        pronunciation: "lah MAH-dreh",
        audioPrompt: "La madre",
      },
      {
        id: "es-u1-l2-v3",
        term: "El padre",
        translation: "The father",
        pronunciation: "el PAH-dreh",
        audioPrompt: "El padre",
      },
      {
        id: "es-u1-l2-v4",
        term: "El hermano",
        translation: "The brother",
        pronunciation: "el er-MAH-noh",
        audioPrompt: "El hermano",
      },
      {
        id: "es-u1-l2-v5",
        term: "La hermana",
        translation: "The sister",
        pronunciation: "lah er-MAH-nah",
        audioPrompt: "La hermana",
      },
    ],
    phrases: [
      {
        id: "es-u1-l2-p1",
        phrase: "Esta es mi familia",
        translation: "This is my family",
        context: "Introducing your family to someone",
      },
      {
        id: "es-u1-l2-p2",
        phrase: "Tengo dos hermanos",
        translation: "I have two siblings",
        context: "Talking about how many siblings you have",
      },
    ],
    activities: [
      {
        id: "es-u1-l2-a1",
        type: "multiple-choice",
        prompt: "How do you say 'mother' in Spanish?",
        vocabularyId: "es-u1-l2-v2",
        options: [
          { id: "es-u1-l2-a1-o1", label: "La madre", isCorrect: true },
          { id: "es-u1-l2-a1-o2", label: "El padre", isCorrect: false },
          { id: "es-u1-l2-a1-o3", label: "La hermana", isCorrect: false },
          { id: "es-u1-l2-a1-o4", label: "El hermano", isCorrect: false },
        ],
      },
      {
        id: "es-u1-l2-a2",
        type: "translate",
        prompt: "Translate to Spanish: my family",
        vocabularyId: "es-u1-l2-v1",
        correctAnswer: "Mi familia",
      },
      {
        id: "es-u1-l2-a3",
        type: "fill-in-the-blank",
        prompt: "Esta es mi ___ (family)",
        correctAnswer: "familia",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        "You are a warm, patient Spanish teacher hosting a live video lesson with a complete beginner. Speak slowly and mix simple Spanish with English translations. Stay focused only on family vocabulary and phrases for this lesson. Encourage the learner to describe their own family using the words provided.",
      greeting: "¡Hola de nuevo! Hoy vamos a hablar sobre la familia.",
      focusVocabularyIds: [
        "es-u1-l2-v1",
        "es-u1-l2-v2",
        "es-u1-l2-v3",
        "es-u1-l2-v4",
        "es-u1-l2-v5",
      ],
    },
  },

  // ---------------------------------------------------------------------
  // French
  // ---------------------------------------------------------------------
  {
    id: "fr-u1-l1",
    unitId: "fr-u1",
    languageCode: "fr",
    title: "Greetings",
    description: "Say hello, be polite, and say goodbye in French.",
    order: 1,
    xpReward: 10,
    goals: [
      { id: "fr-u1-l1-g1", description: "Greet someone in French" },
      { id: "fr-u1-l1-g2", description: "Say please and thank you" },
      { id: "fr-u1-l1-g3", description: "Say goodbye politely" },
    ],
    vocabulary: [
      {
        id: "fr-u1-l1-v1",
        term: "Bonjour",
        translation: "Hello",
        pronunciation: "bohn-ZHOOR",
        audioPrompt: "Bonjour",
      },
      {
        id: "fr-u1-l1-v2",
        term: "Bonsoir",
        translation: "Good evening",
        pronunciation: "bohn-SWAHR",
        audioPrompt: "Bonsoir",
      },
      {
        id: "fr-u1-l1-v3",
        term: "Au revoir",
        translation: "Goodbye",
        pronunciation: "oh ruh-VWAHR",
        audioPrompt: "Au revoir",
      },
      {
        id: "fr-u1-l1-v4",
        term: "S'il vous plaît",
        translation: "Please",
        pronunciation: "seel voo PLEH",
        audioPrompt: "S'il vous plaît",
      },
      {
        id: "fr-u1-l1-v5",
        term: "Merci",
        translation: "Thank you",
        pronunciation: "mehr-SEE",
        audioPrompt: "Merci",
      },
    ],
    phrases: [
      {
        id: "fr-u1-l1-p1",
        phrase: "Comment ça va?",
        translation: "How are you?",
        context: "Casual greeting between friends",
      },
      {
        id: "fr-u1-l1-p2",
        phrase: "Enchanté",
        translation: "Nice to meet you",
        context: "When meeting someone for the first time",
      },
    ],
    activities: [
      {
        id: "fr-u1-l1-a1",
        type: "multiple-choice",
        prompt: "How do you say 'Hello' in French?",
        vocabularyId: "fr-u1-l1-v1",
        options: [
          { id: "fr-u1-l1-a1-o1", label: "Bonjour", isCorrect: true },
          { id: "fr-u1-l1-a1-o2", label: "Au revoir", isCorrect: false },
          { id: "fr-u1-l1-a1-o3", label: "Merci", isCorrect: false },
          { id: "fr-u1-l1-a1-o4", label: "Bonsoir", isCorrect: false },
        ],
      },
      {
        id: "fr-u1-l1-a2",
        type: "translate",
        prompt: "Translate to French: Thank you",
        vocabularyId: "fr-u1-l1-v5",
        correctAnswer: "Merci",
      },
      {
        id: "fr-u1-l1-a3",
        type: "listen-and-select",
        prompt: "Listen and select what you hear",
        vocabularyId: "fr-u1-l1-v3",
        options: [
          { id: "fr-u1-l1-a3-o1", label: "Bonjour", isCorrect: false },
          { id: "fr-u1-l1-a3-o2", label: "Au revoir", isCorrect: true },
          { id: "fr-u1-l1-a3-o3", label: "Merci", isCorrect: false },
          { id: "fr-u1-l1-a3-o4", label: "Bonsoir", isCorrect: false },
        ],
      },
      {
        id: "fr-u1-l1-a4",
        type: "fill-in-the-blank",
        prompt: "Complete the phrase: Comment ça ___?",
        correctAnswer: "va",
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        "You are a warm, patient French teacher hosting a live video lesson with a complete beginner. Speak slowly, repeat key words, and mix simple French with English translations. Stay focused only on the greetings and courtesy vocabulary and phrases for this lesson. Gently correct pronunciation and praise effort often.",
      greeting: "Bonjour ! Je suis ton professeur de français. On commence ?",
      focusVocabularyIds: [
        "fr-u1-l1-v1",
        "fr-u1-l1-v3",
        "fr-u1-l1-v4",
        "fr-u1-l1-v5",
      ],
    },
  },

  // ---------------------------------------------------------------------
  // Japanese
  // ---------------------------------------------------------------------
  {
    id: "ja-u1-l1",
    unitId: "ja-u1",
    languageCode: "ja",
    title: "Greetings",
    description: "Say hello, be polite, and say goodbye in Japanese.",
    order: 1,
    xpReward: 10,
    goals: [
      { id: "ja-u1-l1-g1", description: "Greet someone in Japanese" },
      { id: "ja-u1-l1-g2", description: "Say please and thank you" },
      { id: "ja-u1-l1-g3", description: "Say goodbye politely" },
    ],
    vocabulary: [
      {
        id: "ja-u1-l1-v1",
        term: "こんにちは",
        translation: "Hello",
        pronunciation: "konnichiwa",
        audioPrompt: "こんにちは",
      },
      {
        id: "ja-u1-l1-v2",
        term: "おはようございます",
        translation: "Good morning",
        pronunciation: "ohayou gozaimasu",
        audioPrompt: "おはようございます",
      },
      {
        id: "ja-u1-l1-v3",
        term: "さようなら",
        translation: "Goodbye",
        pronunciation: "sayounara",
        audioPrompt: "さようなら",
      },
      {
        id: "ja-u1-l1-v4",
        term: "お願いします",
        translation: "Please",
        pronunciation: "onegaishimasu",
        audioPrompt: "お願いします",
      },
      {
        id: "ja-u1-l1-v5",
        term: "ありがとうございます",
        translation: "Thank you",
        pronunciation: "arigatou gozaimasu",
        audioPrompt: "ありがとうございます",
      },
    ],
    phrases: [
      {
        id: "ja-u1-l1-p1",
        phrase: "お元気ですか",
        translation: "How are you?",
        context: "Polite greeting when checking in on someone",
      },
      {
        id: "ja-u1-l1-p2",
        phrase: "はじめまして",
        translation: "Nice to meet you",
        context: "When meeting someone for the first time",
      },
    ],
    activities: [
      {
        id: "ja-u1-l1-a1",
        type: "multiple-choice",
        prompt: "How do you say 'Hello' in Japanese?",
        vocabularyId: "ja-u1-l1-v1",
        options: [
          { id: "ja-u1-l1-a1-o1", label: "こんにちは", isCorrect: true },
          { id: "ja-u1-l1-a1-o2", label: "さようなら", isCorrect: false },
          {
            id: "ja-u1-l1-a1-o3",
            label: "ありがとうございます",
            isCorrect: false,
          },
          { id: "ja-u1-l1-a1-o4", label: "お願いします", isCorrect: false },
        ],
      },
      {
        id: "ja-u1-l1-a2",
        type: "translate",
        prompt: "Translate to Japanese: Thank you",
        vocabularyId: "ja-u1-l1-v5",
        correctAnswer: "ありがとうございます",
      },
      {
        id: "ja-u1-l1-a3",
        type: "listen-and-select",
        prompt: "Listen and select what you hear",
        vocabularyId: "ja-u1-l1-v3",
        options: [
          { id: "ja-u1-l1-a3-o1", label: "こんにちは", isCorrect: false },
          { id: "ja-u1-l1-a3-o2", label: "さようなら", isCorrect: true },
          {
            id: "ja-u1-l1-a3-o3",
            label: "おはようございます",
            isCorrect: false,
          },
          { id: "ja-u1-l1-a3-o4", label: "お願いします", isCorrect: false },
        ],
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        "You are a warm, patient Japanese teacher hosting a live video lesson with a complete beginner. Speak slowly, repeat key words, and say each word in Japanese followed by its romaji reading and English translation. Stay focused only on the greetings and courtesy vocabulary and phrases for this lesson. Gently correct pronunciation and praise effort often.",
      greeting:
        "こんにちは！(Konnichiwa!) I'm your Japanese teacher. Ready to learn some greetings?",
      focusVocabularyIds: [
        "ja-u1-l1-v1",
        "ja-u1-l1-v3",
        "ja-u1-l1-v4",
        "ja-u1-l1-v5",
      ],
    },
  },
];
