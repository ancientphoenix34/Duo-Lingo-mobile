import { lessons } from "@/data/lessons";
import { buildCallId, requireClerkUserId } from "@/lib/stream-server";

// The Vision Agent service (vision-agent/, `uv run agent.py serve`). Kept
// server-side only: the mobile app never learns this URL, it just asks this
// route to start or stop the teacher.
const visionAgentUrl = process.env.VISION_AGENT_URL;

// Matches CALL_TYPE in ../stream/call+api.ts - the agent has to join the same
// call type the learner is on.
const CALL_TYPE = "audio_room";

/** Starts a Vision Agent session so the AI teacher joins this lesson's call. */
export async function POST(request: Request) {
  const userId = await requireClerkUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!visionAgentUrl) {
    return Response.json({ error: "VISION_AGENT_URL is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { lessonId?: string } | null;
  const lesson = lessons.find((item) => item.id === body?.lessonId);
  if (!lesson) {
    return Response.json({ error: "Unknown lessonId" }, { status: 400 });
  }

  const callId = buildCallId(lesson.id, userId);

  const res = await fetch(`${visionAgentUrl}/calls/${encodeURIComponent(callId)}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_type: CALL_TYPE }),
  });

  if (!res.ok) {
    console.error("Vision Agent refused to start a session", res.status, await res.text());
    return Response.json({ error: "Could not start the AI teacher" }, { status: 502 });
  }

  const session = (await res.json()) as { session_id: string };
  return Response.json({ sessionId: session.session_id, callId });
}

/**
 * Asks the Vision Agent to close a session. The agent server processes this
 * asynchronously (202) and answers 404 once the session is already gone, which
 * is a normal outcome here - the agent also leaves on its own idle timeout.
 */
export async function DELETE(request: Request) {
  const userId = await requireClerkUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!visionAgentUrl) {
    return Response.json({ error: "VISION_AGENT_URL is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  const sessionId = searchParams.get("sessionId");

  if (!lessonId || !sessionId) {
    return Response.json({ error: "lessonId and sessionId are required" }, { status: 400 });
  }

  // Deriving the call id from the caller's own Clerk id is what stops one
  // learner from closing another learner's agent session.
  const callId = buildCallId(lessonId, userId);

  const res = await fetch(
    `${visionAgentUrl}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );

  if (!res.ok && res.status !== 404) {
    console.error("Vision Agent refused to close a session", res.status, await res.text());
    return Response.json({ error: "Could not stop the AI teacher" }, { status: 502 });
  }

  return Response.json({ stopped: true });
}
