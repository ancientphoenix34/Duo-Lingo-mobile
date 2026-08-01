import { lessons } from "@/data/lessons";
import { buildCallId, requireClerkUserId } from "@/lib/stream-server";

// The Vision Agent service (vision-agent/, `uv run agent.py serve`). Kept
// server-side only: the mobile app never learns this URL, it just asks this
// route to signal the teacher.
const visionAgentUrl = process.env.VISION_AGENT_URL;

type PttAction = "start" | "stop";

/**
 * Push-to-talk signal for the AI teacher: "start" (mic pressed) interrupts
 * the teacher immediately, "stop" (mic released) asks it to reply. One
 * route for both since they always fire in lockstep from the same button
 * gesture and share all the same auth/lookup work.
 */
export async function POST(request: Request) {
  const userId = await requireClerkUserId(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!visionAgentUrl) {
    return Response.json({ error: "VISION_AGENT_URL is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    lessonId?: string;
    sessionId?: string;
    action?: PttAction;
  } | null;

  const lesson = lessons.find((item) => item.id === body?.lessonId);
  if (!lesson) {
    return Response.json({ error: "Unknown lessonId" }, { status: 400 });
  }

  const sessionId = body?.sessionId;
  if (!sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (body?.action !== "start" && body?.action !== "stop") {
    return Response.json({ error: "action must be 'start' or 'stop'" }, { status: 400 });
  }

  const callId = buildCallId(lesson.id, userId);

  const res = await fetch(
    `${visionAgentUrl}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}/ptt/${body.action}`,
    { method: "POST" },
  );

  // A 404 here just means the session already ended (e.g. mid-teardown) -
  // same harmless outcome DELETE /api/agent/session already tolerates.
  if (!res.ok && res.status !== 404) {
    console.error("Vision Agent refused a push-to-talk signal", res.status, await res.text());
    return Response.json({ error: "Could not signal the AI teacher" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
