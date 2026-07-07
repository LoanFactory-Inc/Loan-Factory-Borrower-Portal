"use client";

import * as React from "react";
import { ChevronDownIcon, PaperclipIcon, PencilIcon, SendIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";

type Message = { id: number; from: "officer" | "me"; text: string; time: string };
type ReplyKey = "documents" | "rates" | "time" | "default";

const QUICK: { key: Exclude<ReplyKey, "default">; labelKey: string }[] = [
  { key: "documents", labelKey: "quick.documents" },
  { key: "time", labelKey: "quick.time" },
  { key: "rates", labelKey: "quick.rates" },
];

// Design palette — a fixed warm light scheme (matches the Chat Widget spec),
// independent of the app theme like the marketing panels.
const C = {
  orange: "#f36f20",
  orangeDark: "#C2591A",
  ink: "#231f1a",
  panelBg: "#ffffff",
  bubbleBorder: "#eceae6",
  text: "#25262b",
  time: "#b3aca2",
  field: "#f6f4f1",
  fieldHover: "#efe9e2",
  quickBorder: "#e6ddd3",
  quickText: "#8a5a2b",
  quickHoverBg: "#fff8f2",
  sendOff: "#f1ede8",
  dot: "#c4bdb2",
  online: "#40C057",
  peekText: "#3f3a33",
} as const;

/** Current wall-clock time as e.g. "9:03 AM". */
function nowLabel() {
  const d = new Date();
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}

/** Pick a canned reply based on keywords in the borrower's message. */
function detectReplyKey(text: string): ReplyKey {
  const l = text.toLowerCase();
  if (/statement|bank|asset|document|upload/.test(l)) return "documents";
  if (/rate|apr|lock/.test(l)) return "rates";
  if (/how long|time|when|close/.test(l)) return "time";
  return "default";
}

/** Avatar with the loan officer's initials. */
function Avatar({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex items-center justify-center rounded-full font-bold text-white", className)}
      style={{ background: C.orange }}
    >
      JM
    </span>
  );
}

/**
 * Floating loan-officer chat widget: a stacked launcher when closed (with an
 * unread badge and a Messenger-style peek preview) that expands into a full
 * conversation panel with quick replies and simulated officer responses.
 */
export function ChatWidget() {
  const { t } = useTranslation("chat");

  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(1);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [usedQuick, setUsedQuick] = React.useState(false);
  const [peekDismissed, setPeekDismissed] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(() => [
    { id: 1, from: "officer", text: t("greeting1"), time: "9:02 AM" },
    { id: 2, from: "officer", text: t("greeting2"), time: "9:03 AM" },
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const typingTimer = React.useRef<number | undefined>(undefined);
  const replyTimer = React.useRef<number | undefined>(undefined);

  // Keep the conversation pinned to the latest message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [messages, typing, open]);

  React.useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(replyTimer.current);
    },
    [],
  );

  const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 70);

  const openPanel = () => {
    setOpen(true);
    setUnread(0);
    focusInput();
  };
  const toggle = () => {
    if (open) setOpen(false);
    else openPanel();
  };

  const send = (text: string, replyKey?: ReplyKey) => {
    const body = text.trim();
    if (!body) return;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text: body, time: nowLabel() }]);
    setDraft("");
    setUsedQuick(true);

    window.clearTimeout(typingTimer.current);
    window.clearTimeout(replyTimer.current);
    const key = replyKey ?? detectReplyKey(body);
    typingTimer.current = window.setTimeout(() => setTyping(true), 500);
    replyTimer.current = window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: "officer", text: t(`replies.${key}`), time: nowLabel() },
      ]);
    }, 2100);
  };

  const canSend = draft.trim().length > 0;
  const showQuick = !usedQuick && messages.length <= 2;
  const showPeek = !open && !peekDismissed && unread > 0;
  const peekText = [...messages].reverse().find((m) => m.from === "officer")?.text ?? "";

  return (
    <div className="fixed right-6 bottom-6 z-70 flex flex-col items-end gap-4">
      {/* ── Conversation panel ── */}
      {open && (
        <div
          className="flex h-141.5 max-h-[calc(100vh-110px)] w-95 max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(20,18,16,0.35)]"
          style={{ color: C.text }}
        >
          {/* header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[#dee2e6] bg-white px-4 py-3.5">
            <div className="relative">
              <Avatar className="size-10.5 text-[15px]" />
              <span
                className="absolute -right-px -bottom-px size-3 rounded-full border-2 border-white"
                style={{ background: C.online }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold" style={{ color: C.text }}>
                {t("name")}
              </div>
              <div className="text-xs text-[#868e96]">
                {t("status")} <span className="font-semibold text-[#2f9e52]">{t("online")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label={t("closeLabel")}
              className="flex size-8.5 items-center justify-center rounded-full bg-[#f1f3f5] text-[#495057] transition-colors hover:bg-[#e9ecef]"
            >
              <ChevronDownIcon className="size-4.5" />
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5"
            style={{ background: C.panelBg }}
          >
            <div className="mb-0.5 text-center">
              <span className="rounded-full bg-[#f1f3f5] px-3 py-1 text-[11px] font-semibold text-[#adb5bd]">
                {t("today")}
              </span>
            </div>

            {messages.map((m) =>
              m.from === "officer" ? (
                <div key={m.id} className="flex max-w-[82%] items-end gap-2.25">
                  <Avatar className="size-6.5 shrink-0 text-[10px]" />
                  <div>
                    <div
                      className="rounded-xl rounded-bl-[3px] border bg-white px-3.5 py-2.75 text-sm leading-relaxed"
                      style={{ borderColor: C.bubbleBorder, color: C.text }}
                    >
                      {m.text}
                    </div>
                    <div className="mt-1 pl-1 text-[10.5px]" style={{ color: C.time }}>
                      {m.time}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="max-w-[82%] self-end">
                  <div
                    className="rounded-xl rounded-br-[3px] px-3.5 py-2.75 text-sm leading-relaxed text-white"
                    style={{ background: C.orange }}
                  >
                    {m.text}
                  </div>
                  <div
                    className="mt-1 pr-1 text-right text-[10.5px]"
                    style={{ color: C.time }}
                  >
                    {m.time}
                  </div>
                </div>
              ),
            )}

            {typing && (
              <div className="flex items-end gap-2.25">
                <Avatar className="size-6.5 shrink-0 text-[10px]" />
                <div
                  className="flex gap-1 rounded-xl rounded-bl-[3px] border bg-white px-3.5 py-3.5"
                  style={{ borderColor: C.bubbleBorder }}
                >
                  <Dot />
                  <Dot delay="0.2s" />
                  <Dot delay="0.4s" />
                </div>
              </div>
            )}
          </div>

          {/* quick replies */}
          {showQuick && (
            <div
              className="flex shrink-0 flex-wrap gap-2 px-3.5 pt-2.5 pb-0.5"
              style={{ background: C.panelBg }}
            >
              {QUICK.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => send(t(q.labelKey), q.key)}
                  className="h-8.5 rounded-lg border-[1.5px] bg-white px-3.5 text-[13px] font-semibold transition-colors"
                  style={{ borderColor: C.quickBorder, color: C.quickText }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.orange;
                    e.currentTarget.style.background = C.quickHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.quickBorder;
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  {t(q.labelKey)}
                </button>
              ))}
            </div>
          )}

          {/* composer */}
          <div
            className="flex shrink-0 items-center gap-2.25 border-t border-[#f1f3f5] bg-white px-3.5 py-3"
          >
            <button
              type="button"
              aria-label={t("attachLabel")}
              className="flex size-9.5 shrink-0 items-center justify-center rounded-full text-[#8a7f70] transition-colors"
              style={{ background: C.field }}
            >
              <PaperclipIcon className="size-4.5" strokeWidth={1.7} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              placeholder={t("placeholder")}
              className="h-10.5 flex-1 rounded-[10px] border-[1.5px] border-transparent px-3.75 text-sm outline-none transition-colors focus:bg-white"
              style={{ background: C.field, color: C.text }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={!canSend}
              aria-label={t("sendLabel")}
              className={cn(
                "flex size-10.5 shrink-0 items-center justify-center rounded-full transition-colors",
                !canSend && "cursor-default",
              )}
              style={{
                background: canSend ? C.orange : C.sendOff,
                color: canSend ? "#fff" : C.dot,
              }}
            >
              <SendIcon className="size-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Peek preview (closed, unread) ── */}
      {showPeek && (
        <div className="flex max-w-75 items-end gap-2.5">
          <Avatar className="size-8.5 shrink-0 text-xs" />
          <button
            type="button"
            onClick={openPanel}
            className="relative rounded-xl rounded-br-[3px] bg-white py-3 pr-9 pl-3.5 text-left shadow-[0_10px_30px_-8px_rgba(20,18,16,0.28)]"
          >
            <div className="mb-0.5 text-xs font-bold" style={{ color: C.orange }}>
              {t("name")}
            </div>
            <div className="text-[13.5px] leading-snug" style={{ color: C.peekText }}>
              {peekText}
            </div>
            <span
              role="button"
              aria-label={t("dismissLabel")}
              onClick={(e) => {
                e.stopPropagation();
                setPeekDismissed(true);
              }}
              className="absolute top-1.5 right-1.5 flex size-5.5 items-center justify-center rounded-full text-[#8a7f70]"
              style={{ background: C.sendOff }}
            >
              <XIcon className="size-3" strokeWidth={2.4} />
            </span>
          </button>
        </div>
      )}

      {/* ── Launcher (closed) ── */}
      {!open ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={t("openLabel")}
            className="relative size-14.5 rounded-full shadow-[0_8px_22px_-6px_rgba(20,18,16,0.32)] transition-transform hover:-translate-y-0.5"
            style={{ background: C.orange }}
          >
            <span className="flex size-full items-center justify-center text-[17px] font-bold text-white">
              JM
            </span>
            <span className="absolute -right-1 -bottom-1 flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-white px-1.5 shadow-md">
              {unread > 0 ? (
                <span className="text-xs font-bold" style={{ color: C.orange }}>
                  {unread}
                </span>
              ) : (
                <span className="size-1.5 rounded-full" style={{ background: C.online }} />
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={openPanel}
            aria-label={t("composeLabel")}
            className="flex size-14.5 items-center justify-center rounded-full border bg-white shadow-[0_8px_22px_-8px_rgba(20,18,16,0.28)] transition-[transform,background] hover:-translate-y-0.5"
            style={{ borderColor: C.bubbleBorder, color: C.ink }}
          >
            <PencilIcon className="size-5.5" strokeWidth={1.7} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label={t("closeLabel")}
          className="flex size-13 items-center justify-center rounded-full border bg-white shadow-[0_8px_22px_-8px_rgba(20,18,16,0.28)] transition-colors hover:bg-[#faf9f7]"
          style={{ borderColor: C.bubbleBorder, color: C.ink }}
        >
          <ChevronDownIcon className="size-5.5" strokeWidth={2.1} />
        </button>
      )}
    </div>
  );
}

/** One bouncing dot of the typing indicator. */
function Dot({ delay }: { delay?: string }) {
  return (
    <span
      className="size-1.75 animate-bounce rounded-full"
      style={{ background: C.dot, ...(delay ? { animationDelay: delay } : {}) }}
    />
  );
}
