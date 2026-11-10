"use client";

// A floating AI button. It opens a small chat window for planning money, saving, and understanding the numbers.
// An answer fills in while it is being written: chart and table first, then the text typed out bit by bit.
// When it is finished it is read aloud with Gemini's voice.
// Nothing is sent until a message is sent, and the chat is forgotten when the window is closed.

import { useEffect, useRef, useState } from "react";
import { speakAnswer } from "@/app/actions";
import { MAX_CHAT_CHARS, MAX_CHAT_MESSAGES, parseAnswer, partialAnswer, type AiAnswer, type ChatMessage } from "@/lib/ai-prompt";
import { IconClose, IconSend, IconSparkle, IconVolume, IconVolumeOff } from "./icons";

const QUICK = [
  "สรุปเดือนนี้ให้หน่อย",
  "วางแผนใช้เงินที่เหลือในเดือนนี้",
  "ช่วยวางแผนเก็บเงิน",
  "ตัดรายจ่ายตรงไหนได้บ้าง",
  "ช่วยตั้งงบเดือนหน้า",
];

type Msg = { role: "user"; text: string } | { role: "ai"; answer: AiAnswer; streaming: boolean };

const VOICE_KEY = "ai-voice";
const FAILED = "AI ยังตอบไม่ได้ ลองถามใหม่อีกครั้งนะ";

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Whether finished answers are read aloud. Remembered on this device.
  const [voiceOn, setVoiceOn] = useState(() => typeof window === "undefined" || window.localStorage.getItem(VOICE_KEY) !== "off");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const full = messages.length >= MAX_CHAT_MESSAGES - 1;
  const last = messages[messages.length - 1];
  const waiting = busy && (!last || last.role === "user");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, waiting, open]);

  function stopVoice() {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingIndex(null);
  }

  function close() {
    requestRef.current?.abort();
    stopVoice();
    setOpen(false);
    setMessages([]);
    setDraft("");
    setError(null);
    setBusy(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    window.localStorage.setItem(VOICE_KEY, next ? "on" : "off");
    if (!next) stopVoice();
  }

  // Reads one answer aloud. If the browser blocks automatic sound, the speaker button on the answer still works.
  async function speak(index: number, text: string) {
    stopVoice();
    setSpeakingIndex(index);
    const result = await speakAnswer(text);
    if (!result.ok) {
      setSpeakingIndex(null);
      setError(result.error);
      return;
    }
    const audio = new Audio(`data:${result.mime};base64,${result.base64}`);
    audioRef.current = audio;
    audio.onended = () => setSpeakingIndex((cur) => (cur === index ? null : cur));
    audio.onerror = () => setSpeakingIndex(null);
    audio.play().catch(() => setSpeakingIndex(null));
  }

  // Sends the chat and shows the answer as it arrives.
  async function ask(next: Msg[]) {
    const history: ChatMessage[] = next.map((m) => (m.role === "user" ? m : { role: "ai", text: m.answer.text }));
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? FAILED);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const part = partialAnswer(raw);
        if (part) setMessages([...next, { role: "ai", answer: part, streaming: true }]);
      }

      const final = parseAnswer(raw);
      if (!final) {
        setMessages(next);
        setError(FAILED);
        return;
      }
      setMessages([...next, { role: "ai", answer: final, streaming: false }]);
      if (voiceOn) void speak(next.length, final.text);
    } catch {
      if (!controller.signal.aborted) {
        setMessages(next);
        setError(FAILED);
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  }

  function send(text: string) {
    const clean = text.trim();
    if (!clean || busy || full) return;
    stopVoice();
    const next: Msg[] = [...messages, { role: "user", text: clean.slice(0, MAX_CHAT_CHARS) }];
    setMessages(next);
    setDraft("");
    setError(null);
    void ask(next);
  }

  return (
    <>
      {open ? null : (
        <button type="button" className="ai-fab" onClick={() => setOpen(true)} aria-label="เปิดผู้ช่วย AI">
          <IconSparkle size={24} />
        </button>
      )}

      {open ? (
        <div className="ai-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="ai-window glass" role="dialog" aria-modal="true" aria-labelledby="ai-title">
            <div className="ai-top">
              <span className="ai-icon"><IconSparkle size={18} /></span>
              <h2 id="ai-title">ผู้ช่วยการเงิน</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "ปิดเสียงตอบ" : "เปิดเสียงตอบ"}
              >
                {voiceOn ? <IconVolume size={20} /> : <IconVolumeOff size={20} />}
              </button>
              <button type="button" className="icon-btn" onClick={close} aria-label="ปิด"><IconClose size={20} /></button>
            </div>

            <div className="ai-body">
              {messages.length === 0 ? (
                <div className="ai-intro">
                  <p>ถามเรื่องเงินได้เลย ผมช่วยวางแผนใช้เงิน วางแผนเก็บเงิน และอธิบายตัวเลขของคุณ ตอบเป็นภาพหรือตารางก่อน แล้วอ่านให้ฟังด้วย</p>
                  <p className="ai-note">AI เห็นแค่ยอดรวมต่อหมวด งบ และยอดเงินในบัญชี ไม่เห็นโน้ตที่จดไว้</p>
                  <div className="ai-quick">
                    {QUICK.map((q) => (
                      <button key={q} type="button" className="ai-chip" onClick={() => send(q)}>{q}</button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) =>
                  m.role === "user" ? (
                    <p key={i} className="ai-msg me">{m.text}</p>
                  ) : (
                    <AnswerView
                      key={i}
                      answer={m.answer}
                      streaming={m.streaming}
                      speaking={speakingIndex === i}
                      onSpeak={() => (speakingIndex === i ? stopVoice() : speak(i, m.answer.text))}
                    />
                  ),
                )
              )}
              {waiting ? <p className="ai-msg bot ai-think" role="status">กำลังคิด...</p> : null}
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {full ? <p className="ai-note">คุยยาวแล้ว ปิดแล้วเปิดใหม่เพื่อเริ่มเรื่องใหม่นะ</p> : null}
              <div ref={endRef} />
            </div>

            <form className="ai-form" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_CHAT_CHARS}
                placeholder="พิมพ์คำถามเรื่องเงิน"
                aria-label="พิมพ์คำถามเรื่องเงิน"
                autoComplete="off"
                disabled={full}
              />
              <button type="submit" className="ai-send" disabled={busy || full || !draft.trim()} aria-label="ส่ง"><IconSend size={20} /></button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

// Shows the text a few characters at a time, catching up faster when it is far behind,
// so it reads like someone typing even though the answer arrives in big pieces.
function Typed({ text, live }: { text: string; live: boolean }) {
  const [shown, setShown] = useState(live ? 0 : text.length);
  useEffect(() => {
    if (shown >= text.length) return;
    const id = window.setInterval(() => {
      setShown((n) => Math.min(text.length, n + Math.max(1, Math.ceil((text.length - n) / 25))));
    }, 30);
    return () => window.clearInterval(id);
  }, [shown, text]);
  return <>{text.slice(0, shown)}</>;
}

// One answer: picture first, then table, then the text, with a speaker button once it is finished.
function AnswerView({
  answer,
  streaming,
  speaking,
  onSpeak,
}: {
  answer: AiAnswer;
  streaming: boolean;
  speaking: boolean;
  onSpeak: () => void;
}) {
  const { chart, table } = answer;
  const max = chart ? Math.max(...chart.items.map((i) => i.value), 1) : 1;
  // Whether this answer was started live, decided once when it first appears.
  const [live] = useState(streaming);

  return (
    <div className="ai-answer">
      {chart ? (
        <figure className="ai-chart">
          {chart.title ? <figcaption>{chart.title}</figcaption> : null}
          <ul>
            {chart.items.map((item) => (
              <li key={item.label}>
                <span className="ai-bar-label">{item.label}</span>
                <span className="ai-bar-track"><span className="ai-bar" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} /></span>
                <span className="ai-bar-value">{item.value.toLocaleString("th-TH")} {chart.unit}</span>
              </li>
            ))}
          </ul>
        </figure>
      ) : null}

      {table ? (
        <div className="ai-table-wrap">
          {table.title ? <p className="ai-table-title">{table.title}</p> : null}
          <table className="ai-table">
            <thead>
              <tr>{table.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {answer.text ? (
        <p className="ai-msg bot"><Typed text={answer.text} live={live} /></p>
      ) : streaming ? (
        <p className="ai-msg bot ai-think" role="status">กำลังเขียน...</p>
      ) : null}

      {streaming ? null : (
        <button type="button" className="ai-listen" onClick={onSpeak} aria-pressed={speaking}>
          {speaking ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
          {speaking ? "หยุดอ่าน" : "ฟังคำตอบ"}
        </button>
      )}
    </div>
  );
}
