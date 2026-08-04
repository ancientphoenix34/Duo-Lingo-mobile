// Server-only Stream + Clerk helpers. Only ever imported from `+api.ts`
// route handlers (src/app/api/**) — never from a screen or component, so the
// Stream API secret and Clerk secret key never reach the client bundle.
import { verifyToken } from "@clerk/backend";
import { StreamClient } from "@stream-io/node-sdk";

import { AI_TEACHER_USER_ID } from "@/lib/stream";

const streamApiKey = process.env.STREAM_API_KEY!;
const streamApiSecret = process.env.STREAM_API_SECRET!;
const clerkSecretKey = process.env.CLERK_SECRET_KEY!;
const visionAgentUrl = process.env.VISION_AGENT_URL;
const agentSharedSecret = process.env.AGENT_SHARED_SECRET;

// The Expo side adds this user to the call as an admin member; the Python
// agent connects as it (see AGENT_USER in vision-agent/agent.py).
export const AI_TEACHER_USER = { id: AI_TEACHER_USER_ID, name: "AI Teacher" };

/**
 * Reserves (or resumes) the Stream Video call for one learner's attempt at
 * one lesson. Deterministic per (lesson, user) so reopening the same lesson
 * rejoins the same call instead of leaking a new one every time.
 *
 * Both stream/call and agent/session derive the call id this way instead of
 * accepting one from the client, which is also what stops a caller from
 * driving someone else's lesson call.
 */
export function buildCallId(lessonId: string, userId: string) {
  return `${lessonId}-${userId}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
}

export function getStreamServerClient() {
  return new StreamClient(streamApiKey, streamApiSecret);
}

/**
 * Derives the Stream user id from the caller's Clerk session token instead of
 * trusting anything the client sends. A client-supplied user id on a token
 * endpoint would let any signed-in user mint a Stream token for someone else.
 */
export async function requireClerkUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const sessionToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!sessionToken) return null;

  try {
    const payload = await verifyToken(sessionToken, { secretKey: clerkSecretKey });
    return payload.sub;
  } catch {
    return null;
  }
}

/** Both agent routes answer 503 when the service address is missing. */
export const isAgentConfigured = Boolean(visionAgentUrl);

/**
 * Calls the Vision Agent service (vision-agent/, `uv run agent.py serve`).
 * Owns its address and the shared secret that authenticates this server to it,
 * so neither ever reaches the mobile app — the app only asks these routes to
 * start, stop, or signal the teacher. The agent rejects anything without the
 * header (see _register_auth_middleware in vision-agent/agent.py).
 */
export function agentFetch(path: string, init?: RequestInit) {
  return fetch(`${visionAgentUrl}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      ...(agentSharedSecret ? { "X-Agent-Secret": agentSharedSecret } : {}),
    },
  });
}

export { streamApiKey };
