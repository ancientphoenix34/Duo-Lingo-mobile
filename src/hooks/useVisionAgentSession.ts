import { useAuth } from "@clerk/expo";
import { useCallStateHooks } from "@stream-io/video-react-native-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

import { AI_TEACHER_USER_ID, startAgentSession, stopAgentSession } from "@/lib/stream";

export type AgentStatus = "idle" | "connecting" | "connected" | "failed";

type Params = {
  lessonId: string;
  /** Whether the learner's own call is up. No point summoning a teacher into a call nobody is on. */
  enabled: boolean;
};

/**
 * Brings the AI teacher into the lesson call and takes it back out again.
 *
 * Must be rendered inside `<StreamCall>`: "connected" means the agent user is
 * actually present in the call, not merely that the Vision Agent service
 * accepted our request to start it.
 *
 * The session is closed when the call ends and again on unmount, so leaving the
 * screen never strands a running agent.
 */
export function useVisionAgentSession({ lessonId, enabled }: Params) {
  const { getToken } = useAuth();
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();

  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string>();
  const [retryKey, setRetryKey] = useState(0);

  // Read by the cleanup, which must not re-run when the id arrives.
  const sessionIdRef = useRef<string | undefined>(undefined);

  const agentJoined = participants.some(
    (participant) => participant.userId === AI_TEACHER_USER_ID,
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    startAgentSession(getToken, { lessonId })
      .then((session) => {
        if (cancelled) {
          // Unmounted mid-request: nothing else will clean this session up.
          stopAgentSession(getToken, { lessonId, sessionId: session.sessionId }).catch((err) =>
            console.error("Failed to stop orphaned agent session", err),
          );
          return;
        }
        sessionIdRef.current = session.sessionId;
      })
      .catch((err) => {
        console.error("Failed to start the AI teacher", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not reach your AI teacher");
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = undefined;
      if (sessionId) {
        stopAgentSession(getToken, { lessonId, sessionId }).catch((err) =>
          console.error("Failed to stop agent session on cleanup", err),
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, enabled, retryKey]);

  const retry = useCallback(() => {
    setFailed(false);
    setError(undefined);
    setRetryKey((key) => key + 1);
  }, []);

  // Derived rather than stored, so the agent leaving the call is reflected
  // immediately instead of needing another render to catch up.
  const status: AgentStatus = !enabled
    ? "idle"
    : failed
      ? "failed"
      : agentJoined
        ? "connected"
        : "connecting";

  return { status, error, retry };
}
