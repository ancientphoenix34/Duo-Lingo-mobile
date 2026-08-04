"""AI language teacher agent: voice-only, joins Stream calls created by the
Expo app and teaches through OpenAI Realtime.

Run:
    uv run agent.py run      # console mode, opens a browser demo call
    uv run agent.py serve    # HTTP server mode, spawns a session per call
"""

import asyncio
import logging
import os
from hmac import compare_digest
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from openai.types.realtime import (
    AudioTranscriptionParam,
    RealtimeAudioConfigInputParam,
    RealtimeAudioConfigParam,
    RealtimeSessionCreateRequestParam,
)

from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.edge.call import Call
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import getstream, openai

load_dotenv()

logger = logging.getLogger(__name__)

# Must match AI_TEACHER_USER_ID in src/lib/stream.ts - the Expo app adds this
# user to the call as an admin member so it is allowed to publish audio.
AGENT_USER = User(id="ai-teacher", name="AI Teacher")

# How to behave on a live voice call. What to actually teach comes from the
# lesson's own systemPrompt, packed into the call's custom data by the Expo app.
BASE_INSTRUCTIONS = """You're a real, warm, energetic language teacher hosting \
a live 1-on-1 voice lesson - never robotic, never scripted-sounding, and \
never a monologue.

- Teach only the language and lesson selected for this call. Stay strictly \
inside its goal, vocabulary, and phrases - never drift into other topics and \
never switch to a different language.
- Speak mostly in English. Introduce each target-language word or phrase \
slowly, and always follow it with its English translation.
- Talk like a real teacher talks: short, natural sentences with contractions \
("let's", "you've got it", "that's it!"), and genuine enthusiasm and \
encouragement.
- This is a live back-and-forth conversation, not a script to read start to \
finish. Keep every turn to one or two conversational sentences, introduce \
exactly ONE new word, phrase, or question per turn, then stop talking \
completely and wait in silence for the student - never chain several \
vocabulary items or phrases together in one turn.
- After you speak, do not keep going on your own. Wait for the student's \
spoken reply, actually listen to what they said, and let it shape your next \
line - react to their specific answer before introducing anything new.
- If they hesitate, stay silent, or mispronounce something, warmly ask them \
to repeat it or try again rather than moving on or answering for them.
- Never read out loud any punctuation, labels, or formatting from your notes."""

FALLBACK_INSTRUCTIONS = """No lesson has been selected. Warmly ask the \
student, in English, which language they'd like to practice, then teach \
that language through English for the rest of the call - one short exchange \
at a time, slowly introduced and translated vocabulary, and lots of \
encouragement."""

# Push-to-talk: the Expo app tells us exactly when the student starts and
# stops talking (see the /ptt/start and /ptt/stop routes below), so we turn
# off OpenAI's own automatic voice-activity turn detection instead of
# guessing pauses server-side.
REALTIME_SESSION = RealtimeSessionCreateRequestParam(
    type="realtime",
    audio=RealtimeAudioConfigParam(
        input=RealtimeAudioConfigInputParam(
            transcription=AudioTranscriptionParam(model="gpt-4o-mini-transcribe"),
            turn_detection=None,
        )
    ),
)


async def create_agent() -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=AGENT_USER,
        instructions=BASE_INSTRUCTIONS,
        llm=openai.Realtime(voice="marin", send_video=False, realtime_session=REALTIME_SESSION),
    )


# Every OpenAI Realtime event that carries transcript text, mapped to which
# speaker it belongs to and whether it's a mid-utterance fragment or the
# closing, authoritative version of the line.
#
# vision-agents' own transcript sync (StreamConversation, wired through
# conversation.upsert_message) already persists final transcripts to the
# call's chat history, but it drops the streaming .delta events entirely
# (see the openai plugin's _handle_openai_event) and the public agent event
# bus only carries completed turns (UserTranscriptEvent in
# core/agents/events.py). So live captions get their own transport below:
# every fragment is forwarded as a Stream Video custom call event the moment
# OpenAI emits it, straight to whichever mobile client already has this call
# open (see useLiveCaptions on the Expo side).
_CAPTION_EVENTS: dict[str, tuple[str, str]] = {
    "response.audio_transcript.delta": ("teacher", "delta"),
    "response.output_audio_transcript.delta": ("teacher", "delta"),
    "response.audio_transcript.done": ("teacher", "final"),
    "response.output_audio_transcript.done": ("teacher", "final"),
    "conversation.item.input_audio_transcription.delta": ("student", "delta"),
    "conversation.item.input_audio_transcription.completed": ("student", "final"),
}


def _wire_live_captions(agent: Agent, call: Call) -> None:
    """Forward every OpenAI transcript fragment - both speakers - to the call
    as a custom event, so the Expo app can render live captions.

    Wraps the LLM's private event handler rather than the public event bus;
    see the comment on ``_CAPTION_EVENTS`` for why. Must run before
    ``agent.join(call)``: that's what calls ``llm.connect()``, which is what
    reads ``llm._handle_openai_event`` and hands it to the RTC manager as its
    one event callback.
    """
    original_handler = agent.llm._handle_openai_event
    lock = asyncio.Lock()
    # Holds references to in-flight send_caption() tasks: asyncio only keeps a
    # weak reference to a running task, so without this a task can be
    # garbage-collected mid-request. Same pattern as Realtime._tool_tasks.
    background_tasks: set[asyncio.Task[None]] = set()

    async def send_caption(event: dict[str, Any]) -> None:
        mapping = _CAPTION_EVENTS.get(event.get("type", ""))
        if mapping is None:
            return
        speaker, mode = mapping
        text = event.get("delta") if mode == "delta" else event.get("transcript")
        if mode == "delta" and not text:
            return

        # Serialized, not just fire-and-forget: concurrent requests could
        # otherwise land out of order and scramble the caption. Same
        # reasoning as the sync lock in StreamConversation._sync_with_lock.
        async with lock:
            try:
                await call.send_call_event(
                    user_id=AGENT_USER.id,
                    custom={
                        "kind": "caption",
                        "speaker": speaker,
                        "mode": mode,
                        "text": text or "",
                        "turnId": event.get("item_id", ""),
                    },
                )
            except Exception:
                logger.exception("Failed to forward a live caption event")

    async def handle_with_captions(event: dict[str, Any]) -> None:
        await original_handler(event)
        # Dispatched in the background so a slow caption request never
        # delays processing of the next realtime event (audio included).
        task = asyncio.create_task(send_caption(event))
        background_tasks.add(task)
        task.add_done_callback(background_tasks.discard)

    agent.llm._handle_openai_event = handle_with_captions


async def join_call(agent: Agent, call_type: str, call_id: str) -> None:
    # The Expo app already reserved this call (POST /api/stream/call) and
    # stamped it with the lesson content as `custom` data before the student
    # joined - get_or_create here just fetches that same call and its custom
    # data, it never overwrites them.
    call = await agent.create_call(call_type, call_id)
    lesson = call.custom_data or {}

    # audio_room calls start in backstage, where nobody can publish. The Expo
    # app already goes live when it creates the call; this covers the agent
    # being pointed at an audio_room call that nothing else has taken live.
    if call_type == "audio_room":
        await call.go_live()

    # Instructions were set at construction time, before we knew which call
    # we'd join. Refresh them now and push them into the realtime session
    # explicitly, since set_instructions() only runs automatically at
    # construction and not on every call.
    agent.instructions = Instructions(input_text=_build_instructions(lesson))
    agent.llm.set_instructions(agent.instructions)

    _wire_live_captions(agent, call)

    async with agent.join(call):
        await agent.simple_response(_greeting_prompt(lesson))
        await agent.finish()


def _build_instructions(lesson: dict[str, Any]) -> str:
    language = lesson.get("languageName") or lesson.get("languageCode")
    if not language:
        return f"{BASE_INSTRUCTIONS}\n\n{FALLBACK_INSTRUCTIONS}"

    sections = [BASE_INSTRUCTIONS]

    # The lesson author's own teaching persona for this specific lesson.
    if system_prompt := lesson.get("systemPrompt"):
        sections.append(system_prompt)

    sections.append(_lesson_brief(lesson, language))
    return "\n\n".join(sections)


def _lesson_brief(lesson: dict[str, Any], language: str) -> str:
    lines = [f"Today's lesson is {language}: {lesson.get('lessonTitle', 'a beginner lesson')}."]

    if description := lesson.get("lessonDescription"):
        lines.append(description)

    if goals := lesson.get("goals"):
        lines.append("By the end the student should be able to:")
        lines.extend(f"- {goal}" for goal in goals)

    if vocabulary := lesson.get("vocabulary"):
        lines.append(
            "Vocabulary for this lesson - teach these one at a time, in "
            "conversation, and only move to the next word after the student "
            "has tried the current one out loud and you've reacted to it:"
        )
        lines.extend(f"- {_format_vocabulary(item)}" for item in vocabulary)

    if phrases := lesson.get("phrases"):
        lines.append("Phrases for this lesson - practice these one at a time the same way:")
        lines.extend(f"- {_format_phrase(item)}" for item in phrases)

    if focus := lesson.get("focusVocabulary"):
        lines.append(f"Spend the most time on: {', '.join(focus)}.")

    lines.append(
        "This is your lesson plan for the whole call, not a script - work "
        "through it gradually across many short back-and-forth turns, never "
        "all at once. Do not introduce vocabulary from other lessons."
    )
    return "\n".join(lines)


def _format_vocabulary(item: dict[str, Any]) -> str:
    line = f"{item.get('term')} - {item.get('translation')}"
    if pronunciation := item.get("pronunciation"):
        line += f" (pronounced {pronunciation})"
    return line


def _format_phrase(item: dict[str, Any]) -> str:
    line = f"{item.get('phrase')} - {item.get('translation')}"
    if context := item.get("context"):
        line += f" ({context})"
    return line


def _greeting_prompt(lesson: dict[str, Any]) -> str:
    language = lesson.get("languageName") or lesson.get("languageCode")
    if not language:
        return (
            "Greet the student in English and ask which language they'd like to "
            "practice today. Then stop talking and wait for their answer - "
            "don't say anything else until they reply."
        )

    # The lesson ships an authored opening line; ask for it verbatim so every
    # student starts the same lesson the same way.
    if greeting := lesson.get("greeting"):
        return (
            f'Open the call by saying exactly this, and nothing before it: "{greeting}" '
            "Then ask one simple opening question to get the student talking, "
            "and stop there - wait for them to answer before you say anything else."
        )

    title = lesson.get("lessonTitle")
    lesson_line = f' on "{title}"' if title else ""
    return (
        f"Greet the student warmly, tell them you're their AI teacher for today's "
        f"{language} lesson{lesson_line}, and ask a simple opening question to "
        "get started. Then stop and wait for them to answer before you say "
        "anything else."
    )


# One lock per session so a fast press/release/press can't let two requests
# race out of order against the same agent. Never pruned, but fine at this
# scale - it lives for the process's lifetime, keyed by session id.
_ptt_locks: dict[str, asyncio.Lock] = {}


def _lock_for(session_id: str) -> asyncio.Lock:
    return _ptt_locks.setdefault(session_id, asyncio.Lock())


def _register_ptt_routes(fast_api: FastAPI, launcher: AgentLauncher) -> None:
    """Wires up push-to-talk signaling from the Expo app onto the same
    FastAPI app the SDK already builds for session start/stop."""

    def _get_session(call_id: str, session_id: str):
        session = launcher.get_session(session_id)
        if session is None or session.call_id != call_id:
            raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
        return session

    @fast_api.post("/calls/{call_id}/sessions/{session_id}/ptt/start")
    async def ptt_start(call_id: str, session_id: str) -> Response:
        session = _get_session(call_id, session_id)
        async with _lock_for(session_id):
            # Stop the teacher talking right now. This is the same call path
            # the SDK's own barge-in uses internally - unlike agent.llm.interrupt()
            # alone, it also flushes already-buffered TTS audio off the
            # outbound track, so it stops what's audibly playing, not just
            # future audio.
            await session.agent._flow.interrupt()
            await session.agent.llm.rtc._send_event({"type": "input_audio_buffer.clear"})
        logger.info("PTT start: session %s", session_id)
        return Response(status_code=202)

    @fast_api.post("/calls/{call_id}/sessions/{session_id}/ptt/stop")
    async def ptt_stop(call_id: str, session_id: str) -> Response:
        session = _get_session(call_id, session_id)
        async with _lock_for(session_id):
            # Turn detection is off (REALTIME_SESSION above), so nothing
            # ends the student's turn or asks the model to reply unless we
            # do it ourselves here.
            await session.agent.llm.rtc._send_event({"type": "input_audio_buffer.commit"})
            await session.agent.llm.rtc._send_event({"type": "response.create"})
        logger.info("PTT stop: session %s", session_id)
        return Response(status_code=202)


def _register_auth_middleware(fast_api: FastAPI) -> None:
    """Rejects any caller that doesn't carry the shared secret. This service is
    only ever meant to be reached by the Expo API routes (src/app/api/agent/*),
    which hold the same secret server-side - without this, publishing it lets
    anyone spawn OpenAI Realtime sessions on our key. Skipped when
    AGENT_SHARED_SECRET is unset so local `uv run agent.py serve` is unchanged."""
    secret = os.environ.get("AGENT_SHARED_SECRET")
    if not secret:
        logger.warning(
            "AGENT_SHARED_SECRET is not set - the agent HTTP API is unauthenticated"
        )
        return

    @fast_api.middleware("http")
    async def require_shared_secret(request: Request, call_next):
        # compare_digest rather than ==, so the secret can't be recovered by
        # timing how long a wrong guess takes to be rejected.
        if not compare_digest(request.headers.get("x-agent-secret") or "", secret):
            return JSONResponse({"detail": "Forbidden"}, status_code=403)
        return await call_next(request)


if __name__ == "__main__":
    launcher = AgentLauncher(create_agent=create_agent, join_call=join_call)
    runner = Runner(launcher)
    _register_auth_middleware(runner.fast_api)
    _register_ptt_routes(runner.fast_api, launcher)
    runner.cli()
