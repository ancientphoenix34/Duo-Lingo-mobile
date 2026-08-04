/// <reference types="node" />
// Vercel entry point. Every request is rewritten here (see vercel.json) and
// delegated to the Expo Router server bundle produced by `expo export -p web`,
// which is what actually serves the API routes in src/app/api/**.
//
// CommonJS on purpose: this runs on @vercel/node, not through Metro.
const { createRequestHandler } = require("expo-server/adapter/vercel");

module.exports = createRequestHandler({
  build: require("path").join(__dirname, "../dist/server"),
});
