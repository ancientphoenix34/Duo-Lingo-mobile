import type { Call } from "@stream-io/video-react-native-sdk";
import { useEffect, useRef, useState } from "react";

type Speaker = "teacher" | "student";
type CaptionMode = "delta" | "final";

type CaptionLine = {
  text: string;
  turnId: string;
  final: boolean;
};

type CaptionsState = Partial<Record<Speaker, CaptionLine>>;

type CaptionPayload = {
  kind?: string;
  speaker?: Speaker;
  mode?: CaptionMode;
  text?: string;
  turnId?: string;
};

// How long a finalized line lingers before clearing - long enough to read a
// short phrase, short enough that the screen doesn't fill up with old lines.
const FINAL_LINE_TTL_MS = 4000;

/**
 * Live, word-by-word captions for both sides of the lesson call.
 *
 * The Python agent (vision-agent/agent.py, `_wire_live_captions`) forwards
 * every OpenAI Realtime transcript fragment - the teacher's speech as the
 * model generates it, and the student's speech as it's transcribed - as a
 * Stream Video custom call event the instant OpenAI emits it. This just
 * listens for those events on the call `<StreamCall>` already joined, so
 * captions ride the same connection as the audio with no extra transport.
 */
export function useLiveCaptions(call: Call | undefined) {
  const [state, setState] = useState<CaptionsState>({});
  const timers = useRef<Partial<Record<Speaker, ReturnType<typeof setTimeout>>>>({});

  useEffect(() => {
    if (!call) return;

    const clearTimer = (speaker: Speaker) => {
      clearTimeout(timers.current[speaker]);
      timers.current[speaker] = undefined;
    };

    const scheduleClear = (speaker: Speaker) => {
      clearTimer(speaker);
      timers.current[speaker] = setTimeout(() => {
        setState((current) => ({ ...current, [speaker]: undefined }));
      }, FINAL_LINE_TTL_MS);
    };

    const unsubscribe = call.on("custom", (event) => {
      const payload = event.custom as CaptionPayload;
      const { speaker, mode } = payload;
      if (
        payload.kind !== "caption" ||
        (speaker !== "teacher" && speaker !== "student") ||
        (mode !== "delta" && mode !== "final")
      ) {
        return;
      }

      const turnId = payload.turnId ?? "";
      const text = payload.text ?? "";
      const other: Speaker = speaker === "teacher" ? "student" : "teacher";

      clearTimer(speaker);

      setState((current) => {
        const currentLine = current[speaker];
        const isNewTurn = currentLine?.turnId !== turnId;
        const nextText = mode === "final" ? text : isNewTurn ? text : currentLine!.text + text;

        // A new turn starting for one speaker means the other's line (if
        // still open) is done, even if its own final event never arrives -
        // mirrors the cross-speaker finalization vision-agents does
        // internally for the chat-backed transcript (RealtimeInferenceFlow).
        const otherLine = current[other];
        const finalizedOther =
          isNewTurn && otherLine && !otherLine.final ? { ...otherLine, final: true } : otherLine;

        return {
          ...current,
          [speaker]: { text: nextText, turnId, final: mode === "final" },
          [other]: finalizedOther,
        };
      });

      if (mode === "final") {
        scheduleClear(speaker);
      }
    });

    return () => {
      unsubscribe();
      clearTimer("teacher");
      clearTimer("student");
    };
  }, [call]);

  return { teacherLine: state.teacher?.text, studentLine: state.student?.text };
}
