const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// The Stream Video SDK is native-only: @stream-io/react-native-webrtc runs
// `new NativeEventEmitter(...)` at module scope, and react-native-web has no
// NativeEventEmitter, so merely importing it throws while Expo prerenders
// routes during `expo export -p web`. The web bundle exists only so Vercel can
// serve the API routes, so both packages resolve to a no-op stub there. Native
// builds never take this branch.
const WEB_STUBBED_MODULES = new Set([
  "@stream-io/react-native-webrtc",
  "@stream-io/video-react-native-sdk",
]);
const webStub = path.resolve(__dirname, "src/lib/web-stubs/stream-video.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && WEB_STUBBED_MODULES.has(moduleName)) {
    return { type: "sourceFile", filePath: webStub };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativewind(config);
