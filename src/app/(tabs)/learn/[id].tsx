import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import {
  CallingState,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { useAudioLessonCall } from "@/hooks/useAudioLessonCall";
import { useLiveCaptions } from "@/hooks/useLiveCaptions";
import { useVisionAgentSession, type AgentStatus } from "@/hooks/useVisionAgentSession";
import { colors } from "@/theme";
import type { Language, Lesson } from "@/types/learning";

// Placeholder streak count until streak tracking is implemented in Zustand
// (mirrors the same placeholder used on the Home screen).
const STREAK_COUNT = 12;

export default function AudioLesson() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const lesson = lessons.find((item) => item.id === id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/learn"));

  if (!lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="h3 text-center">Lesson not found</Text>
          <Pressable onPress={goBack} className="bg-lingua-purple rounded-full px-6 py-3">
            <Text className="text-white font-poppins-semibold">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const language = languages.find((item) => item.code === lesson.languageCode)!;

  return <AudioLessonScreen lesson={lesson} language={language} goBack={goBack} />;
}

function AudioLessonScreen({
  lesson,
  language,
  goBack,
}: {
  lesson: Lesson;
  language: Language;
  goBack: () => void;
}) {
  const { user } = useUser();
  const posthog = usePostHog();

  const { call, status, error, endCall, retry } = useAudioLessonCall({ lessonId: lesson.id });

  const handleEndCall = async () => {
    posthog.capture("audio_lesson_ended", { lessonId: lesson.id });
    await endCall();
    goBack();
  };

  if (status === "connecting") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="body-md-muted text-center">Connecting to your AI teacher…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text className="h4 text-center">Could not connect</Text>
          <Text className="body-md-muted text-center">{error}</Text>
          <Pressable onPress={retry} className="bg-lingua-purple rounded-full px-6 py-3">
            <Text className="text-white font-poppins-semibold">Try again</Text>
          </Pressable>
          <Pressable onPress={goBack} hitSlop={8}>
            <Text className="body-sm text-text-secondary">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "ended" || !call) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Text className="h3 text-center">Call ended</Text>
          <Pressable onPress={goBack} className="bg-lingua-purple rounded-full px-6 py-3">
            <Text className="text-white font-poppins-semibold">Back to lessons</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StreamCall call={call}>
      <AudioLessonJoined
        lesson={lesson}
        language={language}
        user={user}
        goBack={goBack}
        onEndCall={handleEndCall}
      />
    </StreamCall>
  );
}

function AudioLessonJoined({
  lesson,
  language,
  user,
  goBack,
  onEndCall,
}: {
  lesson: Lesson;
  language: Language;
  user: ReturnType<typeof useUser>["user"];
  goBack: () => void;
  onEndCall: () => void;
}) {
  const call = useCall();
  const { useCallCallingState, useLocalParticipant } = useCallStateHooks();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
  const isReconnecting = callingState === CallingState.RECONNECTING;

  // Push-to-talk: held mirrors the button press directly rather than the
  // Stream mic's own (network-confirmed, slightly laggy) mute state, so the
  // UI responds the instant the student presses, not after the SDK confirms.
  const [held, setHeld] = useState(false);

  // Stream reports the local participant's own mic level (0-1) back from the
  // SFU, same mechanism used for speaking indicators elsewhere in the SDK.
  // Animate towards it while held so the ring pulses smoothly with voice
  // volume, and drop it to 0 the moment the button is released.
  const [micLevel] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(micLevel, {
      toValue: held ? (localParticipant?.audioLevel ?? 0) : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [held, localParticipant?.audioLevel, micLevel]);

  // Dropping this to false the moment the learner leaves tears the agent
  // session down without waiting for the screen to unmount.
  const {
    status: agentStatus,
    retry: retryAgent,
    sessionId,
    pushToTalk,
  } = useVisionAgentSession({
    lessonId: lesson.id,
    enabled: callingState !== CallingState.LEFT,
  });

  const pttReady = agentStatus === "connected" && Boolean(sessionId);

  const { teacherLine, studentLine } = useLiveCaptions(call);

  const handlePressIn = () => {
    setHeld(true);
    call?.microphone.enable().catch((err) => console.error("Failed to enable microphone", err));
    pushToTalk("start");
  };

  const handlePressOut = () => {
    setHeld(false);
    call?.microphone.disable().catch((err) => console.error("Failed to disable microphone", err));
    pushToTalk("stop");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-1">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={goBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text className="h4">AI Teacher</Text>
            <AgentStatusPill
              status={agentStatus}
              isReconnecting={isReconnecting}
              onRetry={retryAgent}
            />
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-full border border-border items-center justify-center">
            <Text className="body-sm font-poppins-semibold">{STREAK_COUNT}</Text>
          </View>
          <View className="w-9 h-9 rounded-full border border-border items-center justify-center">
            <Ionicons name="notifications-outline" size={17} color={colors.textPrimary} />
          </View>
          <Pressable
            onPress={onEndCall}
            className="w-9 h-9 rounded-full bg-error items-center justify-center"
          >
            <Ionicons name="call" size={16} color="#ffffff" style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
        </View>
      </View>

      {/* Teacher preview / media card */}
      <View className="flex-1 mx-5 mt-4 rounded-3xl overflow-hidden">
        <LinearGradient
          colors={["#FDF0E4", "#EDE6FB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View className="absolute top-4 left-4 bg-black/40 rounded-full px-3 py-1.5">
            <Text className="text-white text-[11px] font-poppins-medium">
              {language.name} · {lesson.title}
            </Text>
          </View>

          <View className="absolute top-4 right-4 items-center gap-1">
            <View className="w-16 h-20 rounded-2xl overflow-hidden border-2 border-white bg-surface">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-lingua-purple">
                  <Ionicons name="person" size={22} color="#ffffff" />
                </View>
              )}
            </View>
            <View className="bg-black/40 rounded-full px-2 py-0.5">
              <Text className="text-white text-[10px] font-poppins-medium">
                {user?.firstName ?? "You"}
              </Text>
            </View>
          </View>

          <View className="flex-1 items-center justify-center p-10">
            <Image source={images.mascotWelcome} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          </View>

          <CaptionsOverlay teacherLine={teacherLine} studentLine={studentLine} />
        </LinearGradient>
      </View>

      {/* Push-to-talk control */}
      <View className="flex-row items-center justify-center mt-5">
        <PushToTalkButton
          held={held}
          disabled={!pttReady}
          level={micLevel}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        />
      </View>

      {/* Session feedback */}
      <View className="flex-row bg-white rounded-3xl mx-5 mt-5 mb-4 py-4" style={styles.feedbackPanel}>
        <FeedbackStat label="Speaking" value="Excellent" valueClassName="text-success" />
        <View className="w-px bg-border" />
        <FeedbackStat label="Pronunciation" value="Great" valueClassName="text-lingua-blue" />
        <View className="w-px bg-border" />
        <FeedbackStat label="Grammar" value="Good" valueClassName="text-lingua-blue" />
      </View>
    </SafeAreaView>
  );
}

// Live subtitles for the media card: the teacher's line grows on the left as
// the model's speech is transcribed, the student's own line grows on the
// right while they hold the mic. Either can be absent - most turns only ever
// show one at a time since the lesson is push-to-talk.
function CaptionsOverlay({ teacherLine, studentLine }: { teacherLine?: string; studentLine?: string }) {
  if (!teacherLine && !studentLine) return null;

  return (
    <View className="absolute bottom-3 left-3 right-3 gap-1.5" pointerEvents="none">
      {teacherLine && (
        <View className="bg-black/60 rounded-2xl px-3.5 py-2 self-start max-w-[92%]">
          <Text className="text-white/60 text-[10px] font-poppins-medium uppercase tracking-wide mb-0.5">
            AI Teacher
          </Text>
          <Text className="text-white text-[14px] font-poppins-medium leading-5">{teacherLine}</Text>
        </View>
      )}
      {studentLine && (
        <View className="bg-lingua-purple/85 rounded-2xl px-3.5 py-2 self-end max-w-[92%]">
          <Text className="text-white/60 text-[10px] font-poppins-medium uppercase tracking-wide mb-0.5">
            You
          </Text>
          <Text className="text-white text-[14px] font-poppins-medium leading-5">{studentLine}</Text>
        </View>
      )}
    </View>
  );
}

// The line under the "AI Teacher" title. A dropped call connection outranks
// the agent's own status, since nothing the agent does is audible while the
// learner's own connection is down.
function AgentStatusPill({
  status,
  isReconnecting,
  onRetry,
}: {
  status: AgentStatus;
  isReconnecting: boolean;
  onRetry: () => void;
}) {
  const { dotClassName, label } = describeAgentStatus(status, isReconnecting);

  return (
    <View className="flex-row items-center gap-1.5 mt-0.5">
      <View className={`w-2 h-2 rounded-full ${dotClassName}`} />
      <Text className="caption">{label}</Text>
      {status === "failed" && !isReconnecting && (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text className="caption text-lingua-purple font-poppins-semibold">Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

function describeAgentStatus(status: AgentStatus, isReconnecting: boolean) {
  if (isReconnecting) return { dotClassName: "bg-warning", label: "Reconnecting…" };

  switch (status) {
    case "connected":
      return { dotClassName: "bg-success", label: "Online" };
    case "connecting":
      return { dotClassName: "bg-warning", label: "Connecting your teacher…" };
    case "failed":
      return { dotClassName: "bg-error", label: "Teacher unavailable" };
    case "idle":
      return { dotClassName: "bg-border", label: "Waiting to start" };
  }
}

// The screen's one primary control: hold to talk. Pressing it interrupts the
// teacher immediately (see pushToTalk("start") in the Python agent) and
// releasing it asks the teacher to reply - there's no separate mute toggle
// anymore, since the mic is only ever live while this is held.
function PushToTalkButton({
  held,
  disabled,
  level,
  onPressIn,
  onPressOut,
}: {
  held: boolean;
  disabled: boolean;
  level: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const ringScale = level.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
    extrapolate: "clamp",
  });
  const ringOpacity = level.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
    extrapolate: "clamp",
  });

  const circleClassName = disabled
    ? "bg-surface border-border"
    : held
      ? "bg-lingua-purple border-lingua-purple"
      : "bg-white border-border";
  const iconColor = disabled ? colors.textSecondary : held ? "#ffffff" : colors.textPrimary;

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled} className="items-center gap-2">
      <View className="w-28 h-28 items-center justify-center">
        <Animated.View
          pointerEvents="none"
          style={[styles.pttLevelRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <View
          className={`w-28 h-28 rounded-full border-2 items-center justify-center ${circleClassName}`}
          style={styles.controlShadow}
        >
          <Ionicons name={held ? "mic" : "mic-outline"} size={38} color={iconColor} />
        </View>
      </View>
      <Text className="caption">{held ? "Listening…" : "Hold to talk"}</Text>
    </Pressable>
  );
}

function FeedbackStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="body-sm text-text-secondary">{label}</Text>
      <Text className={`text-[15px] font-poppins-semibold ${valueClassName}`}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // White, not purple: the button itself turns solid `lingua-purple` while
  // held, so a purple ring would blend straight into it and never be seen.
  pttLevelRing: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#ffffff",
  },
  controlShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feedbackPanel: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
});
