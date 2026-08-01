// Client-safe Stream Video helpers. The Stream API key is public (not a
// secret) so it's fine in an EXPO_PUBLIC_ var; token minting and call
// creation always happen server-side in src/app/api/stream/*+api.ts.
export const streamApiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY!;

if (!streamApiKey) {
  throw new Error("Add EXPO_PUBLIC_STREAM_API_KEY to your .env file");
}

export type StreamTokenSession = {
  apiKey: string;
  token: string;
  userId: string;
};

export type StreamCallSession = {
  callId: string;
  callType: string;
};

export type AgentSession = {
  sessionId: string;
  callId: string;
};

// The AI teacher's Stream user id. Must match AGENT_USER in
// vision-agent/agent.py; the screen uses it to tell whether the agent has
// actually joined the call yet.
export const AI_TEACHER_USER_ID = "ai-teacher";

type GetToken = () => Promise<string | null>;

async function authedFetch<T>(path: string, getToken: GetToken, init?: RequestInit): Promise<T> {
  const sessionToken = await getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  if (!res.ok) {
    // Read as text first - a response body can only be consumed once, and
    // res.json() failing on non-JSON output would otherwise leave nothing
    // left to fall back to.
    const bodyText = await res.text().catch(() => "");
    const reason = safeParseErrorMessage(bodyText) ?? bodyText;
    throw new Error(`Stream request to ${path} failed: ${res.status}${reason ? ` - ${reason}` : ""}`);
  }

  return res.json();
}

function safeParseErrorMessage(bodyText: string): string | undefined {
  try {
    const parsed = JSON.parse(bodyText) as { error?: string };
    return parsed.error;
  } catch {
    return undefined;
  }
}

// Used as the Stream Video client's `tokenProvider` — called on connect and
// again whenever the current token nears expiry.
export const fetchStreamToken = (getToken: GetToken) =>
  authedFetch<StreamTokenSession>("/api/stream/token", getToken);

// Reserves the Stream Video call for this lesson attempt before joining it.
// Only the lesson id travels: the route looks the lesson content up itself so
// the AI teacher's prompt can't be rewritten from the client.
export const fetchStreamCall = (getToken: GetToken, params: { lessonId: string }) =>
  authedFetch<StreamCallSession>("/api/stream/call", getToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

// Asks the Vision Agent service to send the AI teacher into this lesson's call.
export const startAgentSession = (getToken: GetToken, params: { lessonId: string }) =>
  authedFetch<AgentSession>("/api/agent/session", getToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

export const stopAgentSession = (
  getToken: GetToken,
  params: { lessonId: string; sessionId: string },
) =>
  authedFetch<{ stopped: boolean }>(
    `/api/agent/session?lessonId=${encodeURIComponent(params.lessonId)}&sessionId=${encodeURIComponent(params.sessionId)}`,
    getToken,
    { method: "DELETE" },
  );

export type PttAction = "start" | "stop";

// Push-to-talk signal: "start" (mic pressed) interrupts the teacher
// immediately, "stop" (mic released) asks it to reply.
export const sendPushToTalk = (
  getToken: GetToken,
  params: { lessonId: string; sessionId: string; action: PttAction },
) =>
  authedFetch<{ ok: boolean }>("/api/agent/ptt", getToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
