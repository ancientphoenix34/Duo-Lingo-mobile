import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import {
  AI_TEACHER_USER,
  buildCallId,
  getStreamServerClient,
  requireClerkUserId,
} from "@/lib/stream-server";
import type { Lesson } from "@/types/learning";

// `audio_room` gives us audio-only calls and Stream's speaking-permission
// model out of the box. Two consequences drive the code below: participants
// need the `admin` role to publish audio, and the call starts in backstage
// (nobody can join until `goLive()` is called).
const CALL_TYPE = "audio_room";

export async function POST(request: Request) {
  const userId = await requireClerkUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { lessonId?: string } | null;

  // The lesson is looked up here rather than accepted from the request body.
  // This payload becomes the AI teacher's system prompt, so letting a client
  // supply it would let any signed-in user rewrite the agent's instructions.
  const lesson = lessons.find((item) => item.id === body?.lessonId);
  if (!lesson) {
    console.error("POST /api/stream/call: unknown lessonId", body?.lessonId);
    return Response.json({ error: "Unknown lessonId" }, { status: 400 });
  }

  const language = languages.find((item) => item.code === lesson.languageCode);

  const streamClient = getStreamServerClient();

  // Call members must be existing Stream users, and the agent only creates
  // itself once it actually joins - which happens after this call is created.
  await streamClient.updateUsers({
    users: {
      [AI_TEACHER_USER.id]: { id: AI_TEACHER_USER.id, name: AI_TEACHER_USER.name },
    },
  });

  const callId = buildCallId(lesson.id, userId);
  const call = streamClient.video.call(CALL_TYPE, callId);

  const created = await call.getOrCreate({
    data: {
      created_by_id: userId,
      // `admin` is what grants audio publishing in audio_room; with the
      // default `user` role both sides would have to request permission to
      // speak, which would leave the AI teacher silent.
      members: [
        { user_id: userId, role: "admin" },
        { user_id: AI_TEACHER_USER.id, role: "admin" },
      ],
      // The lesson is push-to-talk: the learner's mic should stay off until
      // they hold the mic button (see the Audio Lesson screen), not publish
      // continuously from the moment they land on screen.
      settings_override: {
        audio: { default_device: "speaker", mic_default_on: false, speaker_default_on: true },
      },
      custom: buildLessonCustomData(lesson, language?.name),
    },
  });

  // audio_room starts in backstage, where joining is blocked entirely. Going
  // live is what opens the call to the learner and the agent alike. Reopening
  // a lesson resumes a call that is already live, hence the check.
  if (created.call.backstage) {
    await call.goLive();
  }

  return Response.json({ callId, callType: CALL_TYPE });
}

// Everything the Vision Agent needs to teach this lesson, flattened onto the
// call's custom data. The agent reads it on join (vision-agent/agent.py) - it
// has no other channel to learn which lesson it is teaching.
function buildLessonCustomData(lesson: Lesson, languageName: string | undefined) {
  return {
    lessonId: lesson.id,
    languageCode: lesson.languageCode,
    languageName: languageName ?? null,
    lessonTitle: lesson.title,
    lessonDescription: lesson.description,
    goals: lesson.goals.map((goal) => goal.description),
    vocabulary: lesson.vocabulary.map((item) => ({
      term: item.term,
      translation: item.translation,
      pronunciation: item.pronunciation ?? null,
    })),
    phrases: lesson.phrases.map((item) => ({
      phrase: item.phrase,
      translation: item.translation,
      context: item.context ?? null,
    })),
    systemPrompt: lesson.aiTeacherPrompt.systemPrompt,
    greeting: lesson.aiTeacherPrompt.greeting,
    focusVocabulary: lesson.aiTeacherPrompt.focusVocabularyIds
      .map((id) => lesson.vocabulary.find((item) => item.id === id)?.term)
      .filter((term): term is string => Boolean(term)),
  };
}
