// No-op stand-in for the native-only Stream Video SDK on web - see the
// resolveRequest rule in metro.config.js for why this exists.
//
// The web bundle is only built so Vercel can serve the Expo Router API routes
// (src/app/api/**). None of the screens that import the video SDK are reachable
// there, so every export resolves to a harmless no-op rather than a real
// implementation. A Proxy is used instead of a fixed list of exports so this
// keeps working as the screens import more of the SDK's surface.
const noop = () => null;

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => (prop === "__esModule" ? true : noop),
  },
);
