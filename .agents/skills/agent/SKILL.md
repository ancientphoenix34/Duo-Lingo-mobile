---
name: Agent
description: Use when building real-time voice and video AI agents, deploying conversational AI to production, integrating with phone networks, adding knowledge bases to agents, or implementing custom AI pipelines with swappable providers.
metadata:
    mintlify-proj: agent
    version: "1.0"
---

# Vision Agents Skill

## Product Summary

Vision Agents is an open-source Python framework for building real-time voice and video AI applications. Agents join calls via Stream's edge network (or your own transport), connect to AI providers through swappable plugins, and respond in real time. The framework handles call lifecycle, audio/video routing, turn-taking, and deployment. You write an `Agent` class, define `create_agent()` and `join_call()` functions, and run with `Runner` for console or HTTP server modes.

**Key files and commands:**
- `agent.py` — Your agent definition with `create_agent()` and `join_call()` functions
- `pyproject.toml` — Dependencies and entry point
- `.env` — API keys for providers (Stream, LLM, STT, TTS)
- `uv run agent.py run` — Console mode (single agent, browser demo)
- `uv run agent.py serve` — HTTP server mode (production, session management)
- `uvx vision-agents init my-agent` — Scaffold a new project

**Primary docs:** https://visionagents.ai

## When to Use

Reach for this skill when:

- **Building voice agents** — STT/LLM/TTS pipelines or realtime speech models (OpenAI, Gemini, Qwen)
- **Building video agents** — VLMs, YOLO processors, or realtime video models
- **Phone integration** — Inbound/outbound calls via Twilio or Telnyx
- **Adding knowledge bases** — RAG with Gemini File Search or TurboPuffer
- **Function calling** — Register Python functions or MCP servers as tools
- **Production deployment** — Docker, Kubernetes, horizontal scaling with Redis
- **Monitoring agents** — Built-in metrics, OpenTelemetry, Prometheus
- **Testing agents** — Text-only testing without audio/video infrastructure

## Quick Reference

### Agent Constructor

```python
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs

agent = Agent(
    edge=getstream.Edge(),                    # Transport layer
    agent_user=User(name="Assistant", id="agent"),
    instructions="You're a helpful assistant.",
    llm=gemini.LLM("gemini-2.5-flash"),      # Text LLM
    stt=deepgram.STT(),                       # Speech-to-text
    tts=elevenlabs.TTS(),                     # Text-to-speech
    # Optional:
    turn_detection=smart_turn.TurnDetection(),
    processors=[],                             # Video processors
    mcp_servers=[],                            # External tools
)
```

### Realtime vs Custom Pipeline

| Mode | Use | Setup |
|------|-----|-------|
| **Realtime** | Lowest latency, native speech | `llm=gemini.Realtime()` — no STT/TTS needed |
| **Custom Pipeline** | Full control per stage | `llm=gemini.LLM()` + `stt=deepgram.STT()` + `tts=elevenlabs.TTS()` |

### Core Methods

| Method | Purpose |
|--------|---------|
| `await agent.create_call(call_type, call_id)` | Create a call on the edge provider |
| `async with agent.join(call):` | Join the call (context manager) |
| `await agent.simple_response(text)` | Send text to LLM, speak response |
| `await agent.say(text)` | Speak text directly (bypass LLM) |
| `await agent.finish()` | Wait for call to end |
| `await agent.close()` | Clean up resources |

### Runner Modes

```python
from vision_agents.core import Runner, AgentLauncher

runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))

# Console: single agent, browser demo
runner.cli()  # Then: uv run agent.py run

# HTTP Server: session management, production
runner.cli()  # Then: uv run agent.py serve --host 0.0.0.0 --port 8000
```

### HTTP Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calls/{call_id}/sessions` | Start agent session |
| DELETE | `/calls/{call_id}/sessions/{session_id}` | Close session |
| GET | `/calls/{call_id}/sessions/{session_id}/metrics` | Get performance metrics |
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check |

### Function Calling

```python
@llm.register_function(description="Get weather for a location")
async def get_weather(location: str) -> dict:
    return {"temp": "22C", "condition": "Sunny"}

# LLM calls automatically when relevant
response = await llm.simple_response("What's the weather in London?")
```

### Event Subscription

```python
from vision_agents.core.edge.events import ParticipantJoinedEvent

@agent.events.subscribe
async def on_participant_joined(event: ParticipantJoinedEvent):
    await agent.simple_response(f"Welcome, {event.participant.user_id}!")
```

## Decision Guidance

### When to Use Realtime vs Custom Pipeline

| Scenario | Realtime | Custom Pipeline |
|----------|----------|-----------------|
| Lowest latency needed | ✓ | — |
| Need specific STT provider | — | ✓ |
| Need specific TTS voice | — | ✓ |
| Function calling required | — | ✓ (realtime has limited tool support) |
| Prototyping quickly | ✓ | — |
| Full control over turn detection | — | ✓ |

### When to Use Each Transport

| Transport | Best For | Setup |
|-----------|----------|-------|
| **Stream Video RTC** | Production, WebRTC, chat memory | `getstream.Edge()` + Stream account |
| **Local** | Dev on your machine | `local.Edge()` — no account needed |
| **Tencent RTC** | Low latency in Asia | `tencent.Edge()` + Tencent account |

### When to Use Each Deployment Mode

| Mode | Use Case | Scaling |
|------|----------|---------|
| **Console (`run`)** | Local dev, testing, demos | Single agent |
| **HTTP Server (`serve`)** | Production, multiple calls | Single node |
| **HTTP + Redis** | Multiple nodes, high availability | Horizontal scaling |
| **Kubernetes** | Enterprise, auto-scaling, monitoring | Full orchestration |

## Workflow

### 1. Scaffold and Configure

```bash
uvx vision-agents init my-agent && cd my-agent
cp .env.example .env
# Fill in: STREAM_API_KEY, STREAM_API_SECRET, GOOGLE_API_KEY, etc.
```

### 2. Define Agent Factory and Join Handler

```python
from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import getstream, gemini, deepgram, elevenlabs

load_dotenv()

async def create_agent(**kwargs) -> Agent:
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Assistant", id="agent"),
        instructions="You're a helpful voice assistant.",
        llm=gemini.LLM("gemini-2.5-flash"),
        stt=deepgram.STT(),
        tts=elevenlabs.TTS(),
    )
    
    @agent.llm.register_function(description="Get weather")
    async def get_weather(location: str) -> dict:
        return {"temp": "22C", "condition": "Sunny"}
    
    return agent

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response("Hello! How can I help?")
        await agent.finish()

if __name__ == "__main__":
    runner = Runner(AgentLauncher(create_agent=create_agent, join_call=join_call))
    runner.cli()
```

### 3. Test Locally

```bash
uv run agent.py run
# Opens browser demo at printed URL
```

### 4. Add Features

- **Video:** Add `processors=[ultralytics.YOLOPoseProcessor(...)]` or `llm=gemini.VLM(...)`
- **RAG:** Register `@llm.register_function` or use `gemini.tools.FileSearch(store)`
- **Phone:** Use `twilio.Telephony()` in `join_call()`
- **Events:** Subscribe with `@agent.events.subscribe`

### 5. Deploy

```bash
# Single container
uv run agent.py serve --host 0.0.0.0 --port 8000

# Multiple nodes (add Redis)
# See: https://visionagents.ai/guides/horizontal-scaling

# Kubernetes
# See: https://visionagents.ai/guides/kubernetes-deployment
```

### 6. Monitor

```python
# Built-in metrics
metrics = agent.metrics
print(f"LLM latency: {metrics.llm_latency_ms__avg}ms")

# OpenTelemetry + Prometheus
# See: https://visionagents.ai/core/telemetry
```

## Common Gotchas

- **Do not reuse Agent instances.** Create a new agent for each call. Calling `join()` twice raises `RuntimeError`.
- **STT/TTS auto-disabled in realtime mode.** If you pass `llm=gemini.Realtime()`, STT and TTS are ignored with a warning.
- **Turn detection ignored if STT provides it.** Deepgram and ElevenLabs have built-in turn detection; passing a separate `turn_detection` plugin is redundant.
- **Async functions only for `@register_function`.** Synchronous functions raise `ValueError`.
- **Event handlers run concurrently.** Don't rely on handler execution order; if one handler depends on state another sets, merge them into one handler.
- **Agent idle timeout closes sessions.** By default, agents disconnect after 60 seconds alone on a call. Set `agent_idle_timeout` in `AgentLauncher` to change.
- **Missing API keys fail silently in some cases.** Always check `.env` is loaded with `load_dotenv()` and all required keys are present.
- **Realtime models have limited tool support.** Use custom pipelines for full function calling.
- **Video override only works with avatar or processor.** Set `agent.set_video_track_override_path()` before `join()` if using video.
- **Session registry required for horizontal scaling.** Single-node deployments use in-memory sessions; multi-node requires Redis or custom `SessionRegistry`.

## Verification Checklist

Before submitting agent code:

- [ ] `.env` file exists and all required API keys are set (check `load_dotenv()` is called)
- [ ] Agent is created fresh in `create_agent()` — not reused across calls
- [ ] `join_call()` calls `await agent.finish()` or has a termination condition
- [ ] STT/TTS are omitted if using realtime LLM
- [ ] All `@register_function` functions are async
- [ ] Event handlers are async functions
- [ ] Tested locally with `uv run agent.py run` before deploying
- [ ] HTTP server tested with `uv run agent.py serve` and curl to `/health`
- [ ] Metrics are accessible at `/calls/{call_id}/sessions/{session_id}/metrics`
- [ ] Docker image builds without errors (if deploying)
- [ ] Environment variables are set in production (not hardcoded)
- [ ] Session limits are configured if running multiple replicas (`max_concurrent_sessions`, `max_sessions_per_call`)

## Resources

**Comprehensive navigation:** https://visionagents.ai/llms.txt

**Critical docs:**
1. [Quickstart](https://visionagents.ai/introduction/quickstart) — Build your first agent in 5 minutes
2. [Voice Agents](https://visionagents.ai/introduction/voice-agents) — Realtime vs custom pipelines, function calling
3. [Built-in HTTP Server](https://visionagents.ai/guides/http-server) — Session management, scaling, authentication
4. [Deployment Overview](https://visionagents.ai/guides/deploying-overview) — Docker, Kubernetes, monitoring
5. [Agent Class Reference](https://visionagents.ai/core/agent-core) — Full API
6. [Integrations](https://visionagents.ai/integrations/introduction-to-integrations) — 35+ providers (LLM, STT, TTS, vision, avatars, telephony)
7. [Testing](https://visionagents.ai/guides/testing) — Text-only agent testing with pytest
8. [Events Reference](https://visionagents.ai/reference/events-reference) — All event types and fields

**GitHub:** https://github.com/GetStream/vision-agents

---

> For additional documentation and navigation, see: https://visionagents.ai/llms.txt