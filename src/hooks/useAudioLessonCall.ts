import { useAuth } from "@clerk/expo";
import { Call, CallingState, useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { useCallback, useEffect, useState } from "react";

import { fetchStreamCall } from "@/lib/stream";

export type AudioLessonCallStatus = "connecting" | "joined" | "error" | "ended";

type Params = {
  lessonId: string;
};

/**
 * Reserves and joins the audio-only Stream Video call for one lesson
 * attempt, then owns that call's lifecycle for as long as the Audio Lesson
 * screen is mounted. The call itself is created server-side (POST
 * /api/stream/call), which is also where the call is taken live and stamped
 * with the lesson content the AI teacher reads on join.
 */
export function useAudioLessonCall({ lessonId }: Params) {
  const client = useStreamVideoClient();
  const { getToken } = useAuth();
  const [call, setCall] = useState<Call>();
  const [status, setStatus] = useState<AudioLessonCallStatus>("connecting");
  const [error, setError] = useState<string>();
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!client) return;

    let cancelled = false;
    let joinedCall: Call | undefined;

    (async () => {
      setStatus("connecting");
      setError(undefined);

      const session = await fetchStreamCall(getToken, { lessonId });
      if (cancelled) return;

      // Reserved server-side already, so this only ever attaches to the
      // existing call - never `{ create: true }` here.
      const c = client.call(session.callType, session.callId, { reuseInstance: true });
      setCall(c);
      joinedCall = c;

      await c.join();
      if (cancelled) return;
      setStatus("joined");
    })().catch((err) => {
      console.error("Failed to join audio lesson call", err);
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Could not connect to your AI teacher");
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      if (joinedCall && joinedCall.state.callingState !== CallingState.LEFT) {
        joinedCall.leave().catch((err) => console.error("Failed to leave call on cleanup", err));
      }
      setCall(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, lessonId, retryKey]);

  const endCall = useCallback(async () => {
    setStatus("ended");
    if (call && call.state.callingState !== CallingState.LEFT) {
      await call.leave().catch((err) => console.error("Failed to leave call", err));
    }
  }, [call]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);

  return { call, status, error, endCall, retry };
}
