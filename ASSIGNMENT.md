# BrightConnect Voice Assistant - Assignment Q&A

## Why Vapi over ElevenLabs Agent Builder?

I tested both Vapi Agents and ElevenLabs Agents for this use case. While ElevenLabs provides an impressive all-in-one agent platform with high-quality voices and strong conversational controls, I chose Vapi due to **architecture clarity, control, and reliability** for production-style voice workflows.

### 1. Better Control Over the Voice Pipeline

With Vapi, the voice stack is explicitly separated:
- STT → LLM → TTS → Tooling → Escalation

This made it easier to:
- Tune latency at each stage
- Swap providers independently
- Reason about failures and fallbacks

ElevenLabs abstracts many of these steps, which is great for speed, but gives less visibility and control over the full pipeline.

### 2. Stronger Intent Handling & Escalation Logic

This use case requires:
- Clear intent detection (schedule, reschedule, cancel, support)
- Predictable conversation flow
- Safe escalation when the agent is unsure

Vapi's agent builder makes intent routing, tool calls, and escalation paths more explicit and easier to reason about. This is especially important for customer support and appointment scheduling, where mistakes are costly.

### 3. More Predictable Real-time Behavior

In testing:
- Vapi showed more consistent turn-taking
- Interruptions and barge-in handling were more predictable
- Latency felt more stable across longer conversations

ElevenLabs performed very well in short demos, but Vapi felt more reliable for longer, stateful calls.

### 4. Easier Debugging & Observability

Vapi provides clearer:
- Event-level visibility (user transcript, agent response, interruptions)
- Failure points
- LLM fallback behavior

This made it easier to iterate, test edge cases, and validate behavior under different scenarios.

---

## Tech Stack Decisions

### Speech-to-Text (STT): Deepgram

**Provider:** Deepgram

Deepgram was selected as the primary speech-to-text provider due to its **low streaming latency** and strong performance in real-time conversational systems. Deepgram consistently provides sub-second partial transcripts, enabling natural back-and-forth interactions. Its streaming-first architecture makes it well-suited for live customer support calls where responsiveness directly impacts user experience.

**Trade-offs:**
- **Speechmatics** was also evaluated and is personally preferred for noisy environments and multilingual or code-switching use cases (e.g., mixed English-Tamil conversations commonly encountered in regions like India)
- In production systems serving diverse languages and accents, Speechmatics would be the preferred choice
- For this low-latency, English-focused use case, Deepgram provides the best overall trade-off
- Speaker diarization is mainly useful in call center scenarios where multiple human speakers are present on the same call

### Text-to-Speech (TTS): ElevenLabs Flash v2.5

**Provider:** ElevenLabs
**Model:** Eleven Flash v2.5

ElevenLabs was selected for text-to-speech due to its **high-quality, natural-sounding voices** and low-latency performance, which are important for delivering a strong customer experience in voice-based support.

**Key Considerations:**
- While ElevenLabs is relatively more expensive compared to some alternative TTS providers, cost optimization was not the primary focus for this prototype
- Latency and voice quality were prioritized over cost, as faster responses and more human-like speech significantly improve perceived responsiveness, trust, and engagement
- The Eleven Flash v2.5 model was chosen specifically for its **~75ms audio generation latency**, making it well-suited for real-time conversational agents
- A more expressive model such as Eleven Turbo v2.5 could be considered if richer voice quality is required

### Language Model: Groq GPT OSS 20B

Two LLM options were considered: OpenAI models (GPT-4o Mini cluster) and Groq-hosted GPT OSS models.

**Why Groq GPT OSS 20B:**
- **Very low inference latency (~280ms)** and cost efficiency
- Groq models are highly optimized for fast inference, making them well-suited for real-time voice interactions where responsiveness is critical
- For simple customer support and scheduling flows, the 20B model provides sufficient language understanding without unnecessary overhead

**Scaling Options:**
- For more complex tasks or advanced reasoning scenarios, GPT OSS 120B could be used
- Still maintains low latency on Groq infrastructure while offering stronger reasoning capabilities
- The choice prioritizes low latency and efficiency for the current task, with flexibility to scale model size as complexity increases

---

## Design Decisions

### Why These Specific Use Cases?

The goal of this prototype was to demonstrate high-quality automation for **common, well-scoped support requests**. Internet troubleshooting and bill payment represent two of the most frequent and structurally different customer intents.

- **Internet Issues:** Requires real-time data lookup (outages), conditional logic (troubleshooting vs. escalation), and follow-up actions (SMS notifications)
- **Bill Payment:** Requires account verification, secure data handling, and multi-channel delivery (SMS/Email)
- **Escalation:** More complex or sensitive flows were intentionally routed to human agents to ensure a good customer experience

### Why No Query Tools?

For this prototype, I **intentionally avoided query tools** to keep the system simple and low-latency. The assistant uses predefined tool calls with structured inputs/outputs.

In a production system with highly dynamic data or complex account-level queries, I would consider query tools for controlled information retrieval.

### Reusable Prompt Patterns

The system prompt uses **reusable confirmation processes** to ensure consistency:

- **[Email Confirmation Process]:** Letter-by-letter spelling confirmation
- **[Phone Confirmation Process]:** Digit-by-digit number confirmation
- **Tool Failure Handling:** Retry once, then graceful fallback with ticket creation
- **Time-based Greetings/Closings:** Dynamic based on time of day (Morning/Afternoon/Evening/Night)

---

## Summary

Although ElevenLabs provides an impressive agent platform with top-tier voice quality, I chose **Vapi Agent Builder** after testing both because Vapi offers a more flexible, developer-centric orchestration layer that gives me explicit control over STT/LLM/TTS selection, integration with external systems, and structured conversation flows that align with real-world customer support requirements.
