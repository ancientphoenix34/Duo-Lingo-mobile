# vision-agent

The AI language teacher: a voice-only [Vision Agents](https://visionagents.ai)
service that joins the Stream Video calls created by the Expo app and teaches
through OpenAI Realtime.

## How it connects to the app

1. The Audio Lesson screen asks `POST /api/stream/call`, which creates an
   `audio_room` call, adds both the learner and `ai-teacher` as **admin**
   members (the role that may publish audio in `audio_room`), takes the call
   live, and stamps the lesson onto the call's `custom` data.
2. Once joined, the screen asks `POST /api/agent/session`, which proxies to
   this service's `POST /calls/{call_id}/sessions`.
3. `join_call()` here fetches the same call and reads `call.custom_data` to
   learn which lesson it is teaching - that is its only source of lesson
   context.
4. On end-call or unmount the screen asks `DELETE /api/agent/session`, which
   proxies to `DELETE /calls/{call_id}/sessions/{session_id}`.

The lesson payload is built server-side in `src/app/api/stream/call+api.ts`
from `src/data/lessons.ts`. The mobile app never supplies it, so a client
cannot rewrite the teacher's instructions.

Fields read from `custom_data`: `languageName`, `languageCode`, `lessonTitle`,
`lessonDescription`, `goals`, `vocabulary`, `phrases`, `systemPrompt`,
`greeting`, `focusVocabulary`. With none of them (running standalone), the
agent asks the student which language they want.

## Setup

```bash
cp .env.example .env
# Fill in STREAM_API_KEY / STREAM_API_SECRET (same values as the parent
# app's .env) and OPENAI_API_KEY.
uv sync
```

## Run

```bash
uv run agent.py serve    # what the Expo app talks to
uv run agent.py run      # console mode: opens a browser demo call
```

`serve` listens on `127.0.0.1:8000` by default. Point the parent app at it with
`VISION_AGENT_URL` in the root `.env`, then start Expo. Both must be running
for the AI teacher to join.
