"""AI language teacher agent: voice-only, joins Stream calls created by the
Expo app and teaches through OpenAI Realtime.

Run:
    uv run agent.py run      # console mode, opens a browser demo call
    uv run agent.py serve    # HTTP server mode, spawns a session per call
"""

from typing import Any

from dotenv import load_dotenv

from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.core.instructions import Instructions
from vision_agents.plugins import getstream, openai

load_dotenv()

# Must match AI_TEACHER_USER_ID in src/lib/stream.ts - the Expo app adds this
# user to the call as an admin member so it is allowed to publish audio.
AGENT_USER = User(id="ai-teacher", name="AI Teacher")

# How to behave on a live voice call. What to actually teach comes from the
# lesson's own systemPrompt, packed into the call's custom data by the Expo app.
BASE_INSTRUCTIONS = """You're a real, warm, energetic language teacher hosting \
a live 1-on-1 voice lesson - never robotic, never scripted-sounding.

- Teach only the language and lesson selected for this call. Stay strictly \
inside its goal, vocabulary, and phrases - never drift into other topics and \
never switch to a different language.
- Speak mostly in English. Introduce each target-language word or phrase \
slowly, and always follow it with its English translation.
- Talk like a real teacher talks: short, natural sentences with contractions \
("let's", "you've got it", "that's it!"), and genuine enthusiasm and \
encouragement.
- This is a live call, not a text chat - keep every reply to one or two \
conversational sentences.
- Ask one thing at a time, then actually listen. Let the student answer \
before you move on, and shape what you say next around what they just said.
- If they hesitate or mispronounce something, warmly ask them to repeat it \
or try again rather than just correcting and moving on.
- Never read out loud any punctuation, labels, or formatting from your notes."""

FALLBACK_INSTRUCTIONS = """No lesson has been selected. Warmly ask the \
student, in English, which language they'd like to practice, then teach \
that language through English for the rest of the call - short sentences, \
slowly introduced and translated vocabulary, and lots of encouragement."""


async def create_agent() -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=AGENT_USER,
        instructions=BASE_INSTRUCTIONS,
        llm=openai.Realtime(voice="marin", send_video=False),
    )


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
        lines.append("Vocabulary to cover:")
        lines.extend(f"- {_format_vocabulary(item)}" for item in vocabulary)

    if phrases := lesson.get("phrases"):
        lines.append("Phrases to practice:")
        lines.extend(f"- {_format_phrase(item)}" for item in phrases)

    if focus := lesson.get("focusVocabulary"):
        lines.append(f"Spend the most time on: {', '.join(focus)}.")

    lines.append(
        "Stay on this material for the whole call. Do not introduce vocabulary "
        "from other lessons."
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
            "practice today."
        )

    # The lesson ships an authored opening line; ask for it verbatim so every
    # student starts the same lesson the same way.
    if greeting := lesson.get("greeting"):
        return (
            f'Open the call by saying exactly this, and nothing before it: "{greeting}" '
            "Then ask one simple opening question to get the student talking."
        )

    title = lesson.get("lessonTitle")
    lesson_line = f' on "{title}"' if title else ""
    return (
        f"Greet the student warmly, tell them you're their AI teacher for today's "
        f"{language} lesson{lesson_line}, and ask a simple opening question to "
        "get started."
    )


if __name__ == "__main__":
    runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))
    runner.cli()
