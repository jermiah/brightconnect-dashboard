# BrightConnect Voice Assistant - Assignment Q&A

## Current Performance

The assistant achieves **best-in-class latency** with excellent cost efficiency:

- **Cost:** ~$0.11/min
- **Latency:** ~665ms end-to-end

This represents a strong balance between response quality and real-time performance for customer support use cases.

---

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

### 2. Prompt-Based Conversation Flow

Vapi relies on the LLM to naturally route conversations based on detailed system prompt instructions, rather than requiring explicit intent definitions. This makes it flexible but requires well-structured prompts to ensure predictable behavior.

This approach works well for:
- Clear conversation flows defined in the system prompt
- Tool calls triggered by conversational context
- Safe escalation when the agent is unsure

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

### Language Model: OpenAI GPT-4o Mini

**Provider:** OpenAI
**Model:** GPT-4o Mini

**Initial Testing with Groq:**
- Initially tested Groq-hosted models (GPT OSS 20B and 120B) due to their very low inference latency (~280ms)
- However, encountered **inconsistent inference quality and errors** during Vapi integration
- Groq's LLM inference within Vapi showed reliability issues that impacted conversation flow

**Why GPT-4o Mini:**
- **Reliable inference** with consistent quality in Vapi's pipeline
- **~390ms latency** - slightly higher than Groq but significantly more stable
- Strong language understanding for customer support flows
- Better handling of tool calls and structured outputs
- Well-documented and proven in production voice applications

The slight latency increase is an acceptable trade-off for significantly improved reliability and inference quality.

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

## Bonus: Further Latency Optimization

The current implementation already achieves **best-in-class latency (~665ms)** using the standard STT → LLM → TTS pipeline. However, there are architectural approaches that could push latency even lower:

### Speech-to-Speech Models

Modern speech-to-speech models bypass the traditional STT → LLM → TTS pipeline entirely, processing audio directly:
- Eliminates intermediate text conversion latency
- More natural prosody and intonation
- Examples: OpenAI's voice mode, emerging multimodal models

### Gemini Live API

Google's Gemini Live API offers real-time multimodal capabilities:
- Native audio understanding and generation
- Potential for lower latency through unified processing
- Early-stage but promising for voice applications

### Custom Inference Pipeline with LiveKit

For production deployments requiring the absolute lowest latency, I would consider:
- **LiveKit** for real-time audio transport and WebRTC infrastructure
- Custom inference pipeline with optimized model serving
- Edge deployment for reduced network latency
- Streaming token generation for faster perceived response

This architectural approach requires more development effort but offers the most control over the entire latency budget.

---

## Summary

This prototype demonstrates a **production-ready voice assistant** with:
- Best-in-class latency (~665ms) and cost efficiency (~$0.11/min)
- Reliable LLM inference with OpenAI GPT-4o Mini
- High-quality voice with ElevenLabs Flash v2.5
- Fast transcription with Deepgram

The architecture prioritizes **reliability and quality** while maintaining excellent performance, with clear paths for further optimization through speech-to-speech models or custom LiveKit-based pipelines.
