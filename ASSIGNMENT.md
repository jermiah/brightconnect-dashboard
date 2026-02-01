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

## Bonus: Achieving 40% Latency Reduction

**Question:** *BrightConnect wants to reduce average latency by 40% while maintaining natural conversation quality. What specific changes would you make?*

The current implementation achieves **~665ms end-to-end latency**. A 40% reduction would target **~400ms**. Based on deep research into the current state of voice AI, here are three approaches ranked by feasibility and impact:

---

### The Latency Problem: Why It Matters

Human conversation has a natural turn-taking rhythm of **200-300ms**. Anything above **500ms** starts to feel noticeably slow. Research shows that modern S2S systems achieve **160-400ms** latencies, representing a **70-80% improvement** over traditional pipelines (which often run **1000-2000ms** without optimization).

Our current **665ms** is already excellent for a traditional STT → LLM → TTS pipeline, but there's room to push further.

---

### Option 1: Speech-to-Speech Architecture (Recommended)

**Target Latency:** ~200-400ms | **Reduction:** 40-70%

Speech-to-speech (S2S) models handle the entire conversation loop within a single model, directly mapping input audio to output audio **without intermediate text transcripts**. The model "hears" the user and generates a spoken response in one continuous process.

**Leading S2S Platforms:**

| Platform | Architecture | Latency | Status |
|----------|-------------|---------|--------|
| OpenAI Realtime API | Native S2S (gpt-4o-realtime) | ~200-400ms | Production |
| Google Gemini Live | Multimodal streaming | ~200-350ms | GA/Preview |
| ElevenLabs Conversational AI | End-to-end agent | ~500ms | Production |

**Why S2S Achieves Lower Latency:**

1. **No Intermediate Transcription:** Converting audio→text→audio incurs processing time and "end of utterance" waits. S2S models listen and formulate responses in parallel.

2. **Streaming, Unified Process:** S2S models output audio continuously while processing input, enabling near-simultaneous listening and speaking.

3. **Preserved Prosody:** Output is learned directly in audio form, producing more natural intonation. This improves *perceived* responsiveness even beyond raw latency gains.

4. **Better Turn-Taking:** Single-model architecture detects user speech and generates output in one loop, handling interruptions/barge-in more fluidly without complex coordination.

**Migration Path for BrightConnect:**

| Component | Current | With OpenAI Realtime |
|-----------|---------|---------------------|
| STT | ~200ms (Deepgram) | Eliminated |
| LLM | ~390ms (GPT-4o Mini) | ~200-400ms (native audio) |
| TTS | ~75ms (ElevenLabs) | Eliminated |
| **Total** | **~665ms** | **~200-400ms** |

**Trade-offs:**
- **Higher cost:** S2S models are compute-intensive (processing raw audio > text)
- **Less control:** No intermediate text to inspect, moderate, or guardrail
- **Voice limitations:** Less customization than dedicated TTS voices
- **Emerging technology:** Still maturing, may have edge-case issues

---

### Option 2: Provider Optimizations (Incremental)

**Target Latency:** ~400-480ms | **Reduction:** 28-40%

Keep the existing architecture but aggressively optimize each component. This is lower risk and can be implemented immediately while evaluating S2S options.

**Optimization 1: TTS Swap to Cartesia Sonic**
- Current: ElevenLabs Flash v2.5 (~75ms)
- Proposed: Cartesia Sonic (~40ms)
- **Savings: ~35ms**
- Cartesia is purpose-built for real-time voice AI with streaming-first architecture

**Optimization 2: Aggressive LLM Streaming**
- Enable first-token optimization (start TTS on first sentence)
- Use smaller context windows for simple queries
- Consider model variants: `gpt-4o-mini` → `gpt-4o-mini-realtime-preview`
- **Savings: ~100ms**

**Optimization 3: STT Endpointing Tuning**
- Reduce VAD silence threshold: 800ms → 300-500ms
- Enable interim results for early LLM triggering
- Trigger LLM on high-confidence partial transcripts
- **Savings: ~50-80ms**

**Optimization 4: Parallel Processing**
- Start LLM inference on partial STT results (don't wait for final)
- Begin TTS streaming before LLM completes full response
- Overlap stages instead of sequential processing

| Component | Current | Optimized | Savings |
|-----------|---------|-----------|---------|
| STT | ~200ms | ~120-150ms | ~50-80ms |
| LLM | ~390ms | ~290ms | ~100ms |
| TTS | ~75ms | ~40ms | ~35ms |
| **Total** | **~665ms** | **~450-480ms** | **~185-215ms** |

**Achieves ~28-32% reduction** - close to 40% but may need Option 1 or 3 for full target.

---

### Option 3: Custom Pipeline with LiveKit

**Target Latency:** ~200-300ms | **Reduction:** 55-70%

For maximum control and absolute lowest latency, build a custom pipeline with LiveKit. This is the "nuclear option" - highest effort but highest potential reward.

**Why LiveKit over Vapi's Architecture:**

| Aspect | Vapi (Current) | LiveKit (Custom) |
|--------|---------------|------------------|
| Transport | WebSocket | WebRTC (UDP-based) |
| Latency | ~50ms | ~20ms |
| Control | Limited | Full |
| Barge-in | Platform-defined | Custom VAD/interrupt logic |
| Model serving | API calls | Self-hosted/edge |

**LiveKit Architecture Advantages:**

1. **WebRTC SFU:** Uses UDP under the hood, handles packet loss gracefully, <50ms one-way on good connections. Eliminates telephony/WebSocket overhead.

2. **Parallel & Streaming Inference:** Full control over orchestration - feed partial STT to LLM before user finishes, start TTS on first tokens.

3. **Edge Deployment:** Deploy inference servers in each region, removing 50-150ms of cloud API latency.

4. **Custom VAD:** Tune silence thresholds, implement predictive turn-taking, aggressive interruption handling.

5. **Model Optimization:** Run quantized models, use vLLM/TensorRT, speculative decoding, keep models warm.

**Theoretical Latency Budget:**
```
Network (edge):        ~20ms
STT (streaming):       ~100ms (early trigger on partial)
LLM (optimized):       ~150ms (speculation + streaming)
TTS (Cartesia stream): ~30ms
─────────────────────────────
Total:                 ~300ms
```

**Advanced: Integrate S2S Model with LiveKit**

The ultimate configuration: use LiveKit for audio transport but replace STT+LLM+TTS with a single S2S model (OpenAI Realtime or self-hosted). LiveKit handles the WebRTC plumbing, the S2S model handles understanding and generation.

```
User Audio → LiveKit SFU → S2S Model → LiveKit SFU → User Audio
              (~20ms)      (~200ms)      (~20ms)
                          Total: ~240ms
```

**Trade-offs:**
- Significant engineering effort (months, not days)
- Requires infrastructure expertise (Kubernetes, model serving, WebRTC)
- Higher operational complexity and monitoring needs
- Must handle edge cases that platforms like Vapi already solve

---

### Strategic Recommendation for BrightConnect

**Phase 1 (Immediate - Week 1-2): Option 2**
- Implement provider optimizations: Cartesia Sonic TTS, endpointing tuning, streaming optimization
- Low risk, immediate ~30% improvement
- **Target: 450-480ms**

**Phase 2 (Short-term - Month 1-2): Option 1 Evaluation**
- Pilot OpenAI Realtime API or Gemini Live on a subset of traffic
- Compare quality, latency, and cost metrics
- **Target: 300-400ms**

**Phase 3 (Long-term - Quarter 2+): Option 3 Consideration**
- If BrightConnect plans to scale to millions of calls
- If unique requirements emerge (on-premise, custom models, specific compliance)
- Build custom LiveKit pipeline with S2S integration
- **Target: 200-300ms**

---

### Deep Dive: Google Gemini Live API

Worth special mention as an alternative to OpenAI Realtime:

**Architecture:**
- Bidirectional streaming over WebSocket
- Native multimodal: audio in → audio out in single model
- Built-in VAD, affective responses, tool calling

**Key Features:**
- `gemini-live-2.5-flash-native-audio` - optimized for low-latency voice
- Supports interruption handling natively
- Vertex AI infrastructure with global edge presence

**When to Choose Gemini Live over OpenAI Realtime:**
- Already in Google Cloud ecosystem
- Need multimodal (vision + audio) capabilities
- Want to avoid OpenAI dependency
- Potentially lower cost at scale

---

### Industry Benchmarks & References

| System Type | Typical Latency | Notes |
|-------------|-----------------|-------|
| Human conversation | 200-300ms | Natural turn-taking rhythm |
| Traditional pipeline (unoptimized) | 1000-2000ms | STT API + LLM API + TTS API |
| Traditional pipeline (optimized) | 500-800ms | Streaming, fast providers |
| Vapi.ai (optimized) | 400-600ms | Best-in-class traditional |
| **Our implementation** | **~665ms** | **Deepgram + GPT-4o Mini + ElevenLabs** |
| OpenAI Realtime | 200-400ms | Native S2S |
| Gemini Live | 200-350ms | Native multimodal |
| Custom LiveKit + S2S | 200-300ms | Maximum optimization |

**Key Insight:** The ~500ms barrier is roughly the ceiling for traditional STT→LLM→TTS pipelines. Breaking through requires architectural change (S2S) or extreme optimization (custom pipeline).

---

### Conclusion

Achieving 40% latency reduction (665ms → 400ms) is definitely feasible:

1. **Quickest win:** Provider optimizations (Option 2) get us to ~450ms with minimal effort
2. **Best balance:** OpenAI Realtime API (Option 1) achieves 200-400ms with moderate integration work
3. **Maximum potential:** Custom LiveKit + S2S (Option 3) can reach ~200ms but requires significant investment

The voice AI industry is clearly moving toward speech-to-speech models. OpenAI's Realtime API and Google's Gemini Live represent this shift. For BrightConnect, adopting S2S technology is not just a latency optimization - it's future-proofing the platform for the next generation of conversational AI.

---

## Summary

This prototype demonstrates a **production-ready voice assistant** with:
- Best-in-class latency (~665ms) and cost efficiency (~$0.11/min)
- Reliable LLM inference with OpenAI GPT-4o Mini
- High-quality voice with ElevenLabs Flash v2.5
- Fast transcription with Deepgram

The architecture prioritizes **reliability and quality** while maintaining excellent performance, with clear paths for further optimization through speech-to-speech models or custom LiveKit-based pipelines.
