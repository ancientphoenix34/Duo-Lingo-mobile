# Deploying Duo-Lingo as a portfolio demo

The showcase is a browser-playable Android build embedded in a portfolio page, backed by a real
deployment. Three services, deployed in this order — **each step bakes in the previous step's URL**:

```
Appetize (browser)  →  Android APK  ──fetch /api/*──►  Vercel (Expo Router server output)
                                                            │  server-side only
                                                            ▼
                                                       Railway (FastAPI vision-agent)
                                                            │
                                                            ▼
                                                     Stream Video + OpenAI Realtime
```

The code changes this requires are already in the repo. What follows is the part that needs your
accounts.

---

## 1. Vision agent → Railway

The agent now refuses any request without an `X-Agent-Secret` header matching `AGENT_SHARED_SECRET`
(see `_register_auth_middleware` in [agent.py](vision-agent/agent.py)). Without this, anyone who
found the URL could spawn OpenAI Realtime sessions on your key. The check is skipped when the var is
unset, so local development is unchanged.

1. Generate a secret: `openssl rand -hex 32`
2. New Railway project → root directory `vision-agent/` (Nixpacks picks up `uv.lock` automatically)
3. Start command:
   ```
   uv run agent.py serve --host 0.0.0.0 --port $PORT
   ```
4. Variables: `STREAM_API_KEY`, `STREAM_API_SECRET`, `OPENAI_API_KEY`, `AGENT_SHARED_SECRET`
5. Generate a public domain — this becomes `VISION_AGENT_URL` in step 2

**Gate — do not continue until this passes:**

```sh
curl -X POST https://<railway-url>/calls/test/sessions \
  -H "Content-Type: application/json" -d '{"call_type":"audio_room"}'
```

Must return **403**. Repeat with `-H "X-Agent-Secret: <your secret>"` and it should not be 403.
(This exact behavior is already verified in-process — 403 / 403 / 201 for missing, wrong, and
correct secrets.)

**If the agent joins calls but is silent**, that's UDP egress being blocked, not a config error.
Redeploy on Fly.io, which is friendlier to WebRTC, using `python:3.12-slim` + `uv sync`.

## 2. API routes → Vercel

`vercel.json` and `api/index.ts` are already committed, and `app.json` is set to
`"web": { "output": "server" }`. Import the repo in Vercel and **don't override the build or install
command** in Project Settings.

> `vercel.json` pins `installCommand` to `npm install --legacy-peer-deps` on purpose.
> `@config-plugins/react-native-webrtc@15.0.1` still declares `peer expo@^56` while this project is
> on Expo 57, so a plain `npm install` dies with `ERESOLVE` *before the build starts*. That deploys
> nothing, and the symptom is every path returning 404 — static assets included — which looks like a
> routing bug but isn't. Don't "fix" it by downgrading Expo.

Environment variables — **server-only, never `EXPO_PUBLIC_`-prefixed**:

| Variable | Value |
|---|---|
| `STREAM_API_KEY` | from Stream dashboard |
| `STREAM_API_SECRET` | from Stream dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys → Secret keys |
| `VISION_AGENT_URL` | the Railway URL from step 1 |
| `AGENT_SHARED_SECRET` | same value as step 1 |

Also set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_STREAM_API_KEY`.
[stream.ts:6-8](src/lib/stream.ts#L6-L8) and [_layout.tsx:20-21](src/app/_layout.tsx#L20-L21)
`throw` at module load when these are missing, and the export prerenders every route — so a missing
one fails the build, not just the page.

```sh
npm i -g vercel
vercel build
vercel deploy --prebuilt
```

**Gate:** `curl -i https://<vercel-url>/api/stream/token` must return **401** — not 404 (route not
mounted) and not 500 (Clerk misconfigured).

## 3. Android APK → EAS

First point the native app at Vercel. In [app.json](app.json), the `expo-router` plugin is currently
the bare string form; convert it to the array form with your deployment URL:

```json
["expo-router", { "origin": "https://<your-vercel-url>.vercel.app" }]
```

This is what makes the relative `fetch("/api/stream/token")` in [stream.ts:35](src/lib/stream.ts#L35)
resolve off the Metro dev server. **Without it the APK hangs on a loading spinner forever after
sign-in** — [StreamVideoProvider.tsx:19-25](src/components/StreamVideoProvider.tsx#L19-L25) renders a
spinner until the Stream client connects, and [useStreamVideoConnection.ts:48](src/hooks/useStreamVideoConnection.ts#L48)
only logs the failure.

[eas.json](eas.json) already has a `preview` profile emitting an `.apk` (the default `production`
profile emits an `.aab`, which Appetize can't run and nobody can sideload).

`.env` is gitignored so EAS won't see it, and `EXPO_PUBLIC_*` vars are inlined at **build** time. Set
these as EAS environment variables on the `preview` profile:
`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_STREAM_API_KEY`, `EXPO_PUBLIC_POSTHOG_API_KEY`,
`EXPO_PUBLIC_POSTHOG_HOST`.

```sh
npx eas build:configure   # first time only, links the project
npx eas build -p android --profile preview
```

**Gate:** sideload the `.apk` on a real phone before uploading it anywhere. Confirm sign-in works,
the app gets past the spinner, and an audio lesson connects with the teacher speaking. A real device
is the only place the full push-to-talk loop can be validated.

## 4. Appetize + the portfolio page

Upload the `.apk`, take the embed snippet, drop the iframe into your portfolio.

Free tier: **100 min/month, 3-minute session cap, 1 concurrent session** (~33 visitor sessions).

Design the page around two hard limits:

- **A visitor cannot sign up.** [sign-up.tsx:46-51](<src/app/(auth)/sign-up.tsx#L46-L51>) requires an
  emailed verification code. Create a demo account in Clerk (email + password, pre-verified), run it
  through onboarding and language selection once so the learn path isn't empty, and show the
  credentials **right next to the embed**.
- **A browser emulator has no microphone.** Appetize documents audio *output* on Android only, with
  no mic passthrough — so the AI teacher can speak but can't hear. Label this honestly on the page
  and let the recording carry the feature.

## 5. The recording

Record 60–90s on a real device: pick a lesson, hold push-to-talk, speak, teacher replies, live
captions render. Make this the hero of the portfolio entry — most visitors watch the video and never
open the emulator. Put the APK download link beside both for anyone on Android who wants the real
thing.

---

## Costs

- **OpenAI Realtime bills per session.** Clerk gates `/api/agent/session`, but every visitor shares
  one demo account, so that's a speed bump rather than a wall. Set a hard spend cap on the OpenAI key.
- Railway free credit is ~$5/month and an always-on FastAPI process will consume it.
- `.env` stays gitignored. `vercel.json`, `api/index.ts`, and `eas.json` carry no secret values.
