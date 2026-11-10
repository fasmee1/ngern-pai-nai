import "server-only";

// Calls Google Gemini. The key stays on the server (GEMINI_API_KEY) and is never sent to the browser.

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-3.5-flash-lite";
const SPEECH_MODEL = "gemini-3.8-flash-tts";
const VOICE = "Charon";

// Server-sent events are separated by a blank line.
const EVENT_BREAK = new RegExp("\r?\n\r?\n");
const LINE_BREAK = new RegExp("\r?\n");

export type SpeechResult = { ok: true; mime: string; base64: string } | { ok: false; error: string };

// One turn of a conversation. "ai" messages are sent to Gemini as the "model" role.
export type Turn = { role: "user" | "ai"; text: string };

// The reply shape the money helper must follow (see ADVISOR_SYSTEM): an optional chart and table, then the text.
const ANSWER_SCHEMA = {
  type: "OBJECT",
  properties: {
    chart: {
      type: "OBJECT",
      nullable: true,
      properties: {
        title: { type: "STRING" },
        unit: { type: "STRING" },
        items: {
          type: "ARRAY",
          items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "NUMBER" } }, required: ["label", "value"] },
        },
      },
      required: ["items"],
    },
    table: {
      type: "OBJECT",
      nullable: true,
      properties: {
        title: { type: "STRING" },
        columns: { type: "ARRAY", items: { type: "STRING" } },
        rows: { type: "ARRAY", items: { type: "ARRAY", items: { type: "STRING" } } },
      },
      required: ["columns", "rows"],
    },
    text: { type: "STRING" },
  },
  required: ["chart", "table", "text"],
  // Picture first, then the words: this is also the order they arrive in while streaming.
  propertyOrdering: ["chart", "table", "text"],
};

export type StreamResult = { ok: true; stream: ReadableStream<Uint8Array> } | { ok: false; error: string; status: number };

// Starts an answer and hands back its text as it is written, so the screen can fill in bit by bit.
export async function streamGemini(system: string, turns: Turn[]): Promise<StreamResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "ยังไม่ได้ตั้งค่า AI", status: 503 };

  let res: Response;
  try {
    res = await fetch(`${BASE}/${MODEL}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role === "ai" ? "model" : "user", parts: [{ text: t.text }] })),
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 6000,
          responseMimeType: "application/json",
          responseSchema: ANSWER_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(110_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "AI ตอบไม่ได้ตอนนี้ ลองอีกครั้งนะ", status: 502 };
  }
  if (res.status === 429) return { ok: false, error: "วันนี้ใช้ AI ครบโควตาฟรีแล้ว ลองใหม่พรุ่งนี้นะ", status: 429 };
  if (!res.ok || !res.body) return { ok: false, error: "AI ตอบไม่ได้ตอนนี้ ลองอีกครั้งนะ", status: 502 };

  const source = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  // Gemini sends server-sent events: "data: {json}" separated by blank lines. Only the answer text is passed on.
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await source.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(EVENT_BREAK);
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split(LINE_BREAK).find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const json = JSON.parse(line.slice(5).trim()) as {
              candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
            };
            const text = json.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            // A broken event is skipped; the next ones still carry text.
          }
        }
      } catch {
        controller.error(new Error("stream failed"));
      }
    },
    cancel() {
      void source.cancel();
    },
  });
  return { ok: true, stream };
}

// Asks for one small JSON answer (no streaming). Returns the raw JSON text, or null if Gemini could not answer.
export async function askGeminiJson(system: string, text: string, schema: object): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500, responseMimeType: "application/json", responseSchema: schema },
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const out = data.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
    return out || null;
  } catch {
    return null;
  }
}

// Reads a short text aloud with Gemini's own voice. Returns audio the browser can play.
export async function speakGemini(text: string): Promise<SpeechResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, error: "ยังไม่ได้ตั้งค่า AI" };

  try {
    const res = await fetch(`${BASE}/${SPEECH_MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    if (res.status === 429) return { ok: false, error: "วันนี้ใช้เสียง AI ครบโควตาแล้ว" };
    if (!res.ok) return { ok: false, error: "เสียง AI ไม่พร้อมตอนนี้" };

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
    };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!part?.data) return { ok: false, error: "เสียง AI ไม่พร้อมตอนนี้" };

    // Raw PCM (L16) has no header, so wrap it as WAV for the browser. WAV from the API is passed through.
    const mime = (part.mimeType ?? "").toLowerCase();
    if (mime.includes("l16") || mime.includes("pcm")) {
      const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
      return { ok: true, mime: "audio/wav", base64: pcmToWavBase64(Buffer.from(part.data, "base64"), rate) };
    }
    return { ok: true, mime: part.mimeType ?? "audio/wav", base64: part.data };
  } catch {
    return { ok: false, error: "เสียง AI ไม่พร้อมตอนนี้" };
  }
}

function pcmToWavBase64(pcm: Buffer, rate: number): string {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}
