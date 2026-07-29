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
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { languages } from "@/data/languages";
import { lessons } from "@/data/lessons";
import { useAudioLessonCall } from "@/hooks/useAudioLessonCall";
import { useVisionAgentSession, type AgentStatus } from "@/hooks/useVisionAgentSession";
import { colors } from "@/theme";
import type { Language, Lesson } from "@/types/learning";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

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

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

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

  // What the AI teacher "says" in the response bubble: its opening greeting
  // first, then each of the lesson's phrases. Tapping the bubble's speaker
  // icon cycles to the next one.
  const teacherMessages: { text: string; translation?: string }[] = [
    { text: lesson.aiTeacherPrompt.greeting },
    ...lesson.phrases.map((phrase) => ({ text: phrase.phrase, translation: phrase.translation })),
  ];
  const currentMessage = teacherMessages[messageIndex % teacherMessages.length];

  return (
    <StreamCall call={call}>
      <AudioLessonJoined
        lesson={lesson}
        language={language}
        user={user}
        goBack={goBack}
        onEndCall={handleEndCall}
        isCameraOn={isCameraOn}
        onToggleCamera={() => setIsCameraOn((value) => !value)}
        showSubtitles={showSubtitles}
        onToggleSubtitles={() => setShowSubtitles((value) => !value)}
        currentMessage={currentMessage}
        onCycleMessage={() => setMessageIndex((index) => (index + 1) % teacherMessages.length)}
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
  isCameraOn,
  onToggleCamera,
  showSubtitles,
  onToggleSubtitles,
  currentMessage,
  onCycleMessage,
}: {
  lesson: Lesson;
  language: Language;
  user: ReturnType<typeof useUser>["user"];
  goBack: () => void;
  onEndCall: () => void;
  isCameraOn: boolean;
  onToggleCamera: () => void;
  showSubtitles: boolean;
  onToggleSubtitles: () => void;
  currentMessage: { text: string; translation?: string };
  onCycleMessage: () => void;
}) {
  const call = useCall();
  const { useMicrophoneState, useCallCallingState } = useCallStateHooks();
  const { isMute } = useMicrophoneState();
  const callingState = useCallCallingState();
  const isReconnecting = callingState === CallingState.RECONNECTING;

  // Dropping this to false the moment the learner leaves tears the agent
  // session down without waiting for the screen to unmount.
  const { status: agentStatus, retry: retryAgent } = useVisionAgentSession({
    lessonId: lesson.id,
    enabled: callingState !== CallingState.LEFT,
  });

  const toggleMic = () => {
    call?.microphone.toggle().catch((err) => console.error("Failed to toggle microphone", err));
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
            <Ionicons name="videocam-outline" size={17} color={colors.textPrimary} />
          </View>
          <View className="w-9 h-9 rounded-full border border-border items-center justify-center">
            <Text className="body-sm font-poppins-semibold">{STREAK_COUNT}</Text>
          </View>
          <View className="w-9 h-9 rounded-full border border-border items-center justify-center">
            <Ionicons name="notifications-outline" size={17} color={colors.textPrimary} />
          </View>
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

          {showSubtitles && (
            <View className="absolute bottom-4 left-4 right-4">
              <View className="bg-white rounded-3xl px-5 py-4 flex-row items-start gap-3" style={styles.bubbleShadow}>
                <View className="flex-1">
                  <Text className="body-lg font-poppins-semibold">{currentMessage.text}</Text>
                  {currentMessage.translation && (
                    <Text className="body-md-muted mt-1">{currentMessage.translation}</Text>
                  )}
                </View>
                <Pressable onPress={onCycleMessage} hitSlop={8} className="mt-1">
                  <Ionicons name="volume-high" size={22} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.bubbleTail} />
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-between px-8 mt-5">
        <ControlButton
          icon={isCameraOn ? "videocam" : "videocam-off"}
          label="Camera"
          active={isCameraOn}
          onPress={onToggleCamera}
        />
        <ControlButton
          icon={isMute ? "mic-off" : "mic"}
          label="Mic"
          active={!isMute}
          onPress={toggleMic}
        />
        <ControlButton
          icon={showSubtitles ? "language" : "language-outline"}
          label="Subtitles"
          active={showSubtitles}
          onPress={onToggleSubtitles}
        />

        <Pressable onPress={onEndCall} className="items-center gap-1.5">
          <View className="w-14 h-14 rounded-full bg-error items-center justify-center" style={styles.endCallShadow}>
            <Ionicons name="call" size={24} color="#ffffff" style={{ transform: [{ rotate: "135deg" }] }} />
          </View>
          <Text className="caption">End Call</Text>
        </Pressable>
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

type ControlButtonProps = {
  icon: IoniconName;
  label: string;
  active: boolean;
  onPress: () => void;
};

// One button in the bottom control row: a circular icon toggle with its
// label underneath. Camera/Mic/Subtitles all share this shape; End Call is
// styled separately since it's the one destructive, filled action.
function ControlButton({ icon, label, active, onPress }: ControlButtonProps) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1.5">
      <View
        className="w-14 h-14 rounded-full bg-white border border-border items-center justify-center"
        style={styles.controlShadow}
      >
        <Ionicons name={icon} size={22} color={active ? colors.textPrimary : colors.error} />
      </View>
      <Text className="caption">{label}</Text>
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
  controlShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  endCallShadow: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleTail: {
    position: "absolute",
    bottom: -6,
    left: 28,
    width: 16,
    height: 16,
    backgroundColor: "#ffffff",
    transform: [{ rotate: "45deg" }],
  },
  feedbackPanel: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
});
