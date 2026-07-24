"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MailIcon,
  MessageCircleIcon,
  PaperclipIcon,
  PhoneIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/helpers";

type View = "ai" | "officer";
type AiMessage = { id: number; from: "ai" | "me"; text: string; time: string };
type OfficerMessage = { id: number; from: "officer" | "me"; text: string; time: string };

type AiReplyKey = "todo" | "rate" | "who" | "status" | "payment" | "default";
type OfficerReplyKey = "documents" | "rates" | "time" | "default";

/** Quick-reply prompts for the AI view — each maps to a canned reply key. */
const AI_QUICK: { key: Exclude<AiReplyKey, "default">; labelKey: string }[] = [
  { key: "todo", labelKey: "ai.quick.todo" },
  { key: "rate", labelKey: "ai.quick.rate" },
  { key: "who", labelKey: "ai.quick.who" },
  { key: "payment", labelKey: "ai.quick.payment" },
];

// Design palette — a fixed warm light scheme (matches the Chat Widget spec),
// independent of the app theme like the marketing panels.
const C = {
  orange: "#f36f20",
  aiGradient: "linear-gradient(140deg,#ff8a3d,#e0551a)",
  ink: "#231f1a",
  bubbleAi: "#f4f2ef",
  text: "#25262b",
  time: "#b3aca2",
  field: "#f6f4f1",
  quickBorder: "#efe2d4",
  quickText: "#a05a22",
  quickHoverBg: "#fff8f2",
  sendOff: "#f1ede8",
  dot: "#c4bdb2",
  online: "#40C057",
} as const;

/** Number of open tasks surfaced on the AI launcher badge. */
const TASK_COUNT = 2;

// Open/closed state, kept at module scope so it survives client-side
// navigations. Each page renders its own PortalShell, so the widget remounts on
// every route change — without this it would re-open every time. It stays
// closed until the borrower taps a launcher; once toggled, the choice persists
// across pages. A full page reload re-evaluates this module back to closed.
let widgetOpen = false;

/** Current wall-clock time as e.g. "9:03 AM". */
function nowLabel() {
  const d = new Date();
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
}

/** Pick a canned assistant reply based on keywords in the borrower's message. */
function detectAiReply(text: string): AiReplyKey {
  const l = text.toLowerCase();
  if (/do|task|need|upload|document|statement|left|next/.test(l)) return "todo";
  if (/rate|apr|lock|expire/.test(l)) return "rate";
  if (/officer|jordan|who|contact|call|talk to|working/.test(l)) return "who";
  if (/status|where|close|how long|when/.test(l)) return "status";
  if (/payment|monthly|cost|pay/.test(l)) return "payment";
  return "default";
}

/** Pick a canned loan-officer reply based on keywords in the borrower's message. */
function detectOfficerReply(text: string): OfficerReplyKey {
  const l = text.toLowerCase();
  if (/statement|bank|asset|document|upload/.test(l)) return "documents";
  if (/rate|apr|lock/.test(l)) return "rates";
  if (/how long|time|when|close/.test(l)) return "time";
  return "default";
}

/** Gradient assistant avatar with a sparkle glyph. */
function AiAvatar({ className, iconSize = 15 }: { className?: string; iconSize?: number }) {
  return (
    <span
      className={cn("flex items-center justify-center rounded-full", className)}
      style={{ background: C.aiGradient }}
    >
      <SparklesIcon size={iconSize} className="text-white" strokeWidth={2} />
    </span>
  );
}

/** Loan-officer avatar with initials on a dark ink background. */
function OfficerAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white",
        className,
      )}
      style={{ background: C.ink }}
    >
      JM
    </span>
  );
}

/** A green "online" presence dot pinned to the bottom-right of an avatar. */
function OnlineDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("absolute rounded-full border-2 border-white", className)}
      style={{ background: C.online }}
    />
  );
}

/**
 * Floating support widget. Closed, it shows two stacked launchers — the loan
 * officer (JM) and the AI loan assistant (with an open-tasks badge). Open, it
 * expands into a panel that switches between an AI-assistant conversation and
 * the loan-officer conversation, each with quick replies and simulated replies.
 */
export function ChatWidget() {
  const { t } = useTranslation("chat");

  // Opens on the AI assistant by default (first load), but the open/closed
  // choice then persists across navigations via the module-level `widgetOpen`.
  const [open, setOpenState] = React.useState(() => widgetOpen);
  const setOpen = React.useCallback((next: boolean) => {
    widgetOpen = next;
    setOpenState(next);
  }, []);
  const [view, setView] = React.useState<View>("ai");
  const [badge, setBadge] = React.useState(TASK_COUNT);

  // AI conversation
  const [aiDraft, setAiDraft] = React.useState("");
  const [aiTyping, setAiTyping] = React.useState(false);
  const [aiMessages, setAiMessages] = React.useState<AiMessage[]>(() => [
    { id: 1, from: "ai", text: t("ai.greeting1"), time: "9:02 AM" },
    { id: 2, from: "ai", text: t("ai.greeting2"), time: "9:02 AM" },
    { id: 3, from: "ai", text: t("ai.greeting3"), time: "9:03 AM" },
    { id: 4, from: "ai", text: t("ai.greeting4"), time: "9:03 AM" },
  ]);

  // Loan-officer conversation
  const [loDraft, setLoDraft] = React.useState("");
  const [loTyping, setLoTyping] = React.useState(false);
  const [loMessages, setLoMessages] = React.useState<OfficerMessage[]>(() => [
    { id: 1, from: "officer", text: t("officer.greeting1"), time: "9:02 AM" },
    { id: 2, from: "officer", text: t("officer.greeting2"), time: "9:03 AM" },
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timers = React.useRef<number[]>([]);

  // Keep the active conversation pinned to its latest message.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
  }, [aiMessages, loMessages, aiTyping, loTyping, open, view]);

  React.useEffect(
    () => () => {
      timers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 70);

  const openAi = () => {
    setOpen(true);
    setView("ai");
    setBadge(0);
    focusInput();
  };
  const openOfficer = () => {
    setOpen(true);
    setView("officer");
    focusInput();
  };
  const close = () => setOpen(false);

  const sendAi = (text: string, replyKey?: AiReplyKey) => {
    const body = text.trim();
    if (!body) return;
    setAiMessages((m) => [...m, { id: Date.now(), from: "me", text: body, time: nowLabel() }]);
    setAiDraft("");
    const key = replyKey ?? detectAiReply(body);
    timers.current.push(window.setTimeout(() => setAiTyping(true), 400));
    timers.current.push(
      window.setTimeout(() => {
        setAiTyping(false);
        setAiMessages((m) => [
          ...m,
          { id: Date.now() + 1, from: "ai", text: t(`ai.replies.${key}`), time: nowLabel() },
        ]);
      }, 1700),
    );
  };

  const sendOfficer = (text: string, replyKey?: OfficerReplyKey) => {
    const body = text.trim();
    if (!body) return;
    setLoMessages((m) => [...m, { id: Date.now(), from: "me", text: body, time: nowLabel() }]);
    setLoDraft("");
    const key = replyKey ?? detectOfficerReply(body);
    timers.current.push(window.setTimeout(() => setLoTyping(true), 500));
    timers.current.push(
      window.setTimeout(() => {
        setLoTyping(false);
        setLoMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            from: "officer",
            text: t(`officer.replies.${key}`),
            time: nowLabel(),
          },
        ]);
      }, 2100),
    );
  };

  const isAi = view === "ai";
  const draft = isAi ? aiDraft : loDraft;
  const setDraft = isAi ? setAiDraft : setLoDraft;
  const submit = () => (isAi ? sendAi(aiDraft) : sendOfficer(loDraft));
  const canSend = draft.trim().length > 0;
  // Quick replies only until the borrower sends their first assistant message.
  const showAiQuick = isAi && !aiMessages.some((m) => m.from === "me");

  return (
    <div className="fixed right-6.5 bottom-6.5 z-70 flex flex-col items-end gap-4">
      {/* ── Conversation panel ── */}
      {open && (
        <div
          className="flex h-150 max-h-[calc(100vh-120px)] w-98 max-w-[calc(100vw-40px)] animate-in flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(20,18,16,0.35)] duration-200 fade-in slide-in-from-bottom-4"
          style={{ color: C.text }}
        >
          {/* header */}
          <div className="flex shrink-0 items-center gap-2.75 border-b border-[#eef0f2] bg-white px-3.5 py-3.25">
            {isAi ? (
              <div className="relative">
                <AiAvatar className="size-10" iconSize={21} />
                <OnlineDot className="-right-px -bottom-px size-2.75" />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAi}
                  aria-label={t("backLabel")}
                  className="flex size-8 items-center justify-center rounded-full bg-[#f1f3f5] text-[#495057] transition-colors hover:bg-[#e9ecef]"
                >
                  <ChevronLeftIcon className="size-4.25" strokeWidth={2} />
                </button>
                <div className="relative">
                  <OfficerAvatar className="size-10 text-[14px]" />
                  <OnlineDot className="-right-px -bottom-px size-2.75" />
                </div>
              </>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold" style={{ color: C.text }}>
                {isAi ? t("ai.name") : t("officer.name")}
              </div>
              <div className="text-xs text-[#868e96]">
                {isAi ? t("ai.status") : t("officer.status")}{" "}
                <span className="font-semibold text-[#2f9e52]">{t("online")}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t("closeLabel")}
              className="flex size-8.5 items-center justify-center rounded-full bg-[#f1f3f5] text-[#495057] transition-colors hover:bg-[#e9ecef]"
            >
              <ChevronDownIcon className="size-4.5" strokeWidth={2} />
            </button>
          </div>

          {/* messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto bg-white px-4 py-5"
          >
            <div className="mb-0.5 text-center">
              <span className="rounded-full bg-[#f1f3f5] px-3 py-1 text-[11px] font-semibold text-[#adb5bd]">
                {t("today")}
              </span>
            </div>

            {isAi
              ? aiMessages.map((m) =>
                  m.from === "ai" ? (
                    <div
                      key={m.id}
                      className="flex max-w-[86%] animate-in items-end gap-2.25 duration-200 fade-in slide-in-from-bottom-1"
                    >
                      <AiAvatar className="size-7 shrink-0" iconSize={15} />
                      <div>
                        <div
                          className="rounded-xl rounded-bl-lg px-3.5 py-2.75 text-sm leading-relaxed"
                          style={{ background: C.bubbleAi, color: C.text }}
                        >
                          {m.text}
                        </div>
                        <div className="mt-1 pl-1 text-[10.5px]" style={{ color: C.time }}>
                          {m.time}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MyBubble key={m.id} text={m.text} time={m.time} />
                  ),
                )
              : loMessages.map((m) =>
                  m.from === "officer" ? (
                    <div
                      key={m.id}
                      className="flex max-w-[84%] animate-in items-end gap-2.25 duration-200 fade-in slide-in-from-bottom-1"
                    >
                      <OfficerAvatar className="size-7 shrink-0 text-[10px]" />
                      <div>
                        <div
                          className="rounded-xl rounded-bl-lg px-3.5 py-2.75 text-sm leading-relaxed"
                          style={{ background: C.bubbleAi, color: C.text }}
                        >
                          {m.text}
                        </div>
                        <div className="mt-1 pl-1 text-[10.5px]" style={{ color: C.time }}>
                          {m.time}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MyBubble key={m.id} text={m.text} time={m.time} />
                  ),
                )}

            {(isAi ? aiTyping : loTyping) && (
              <div className="flex items-end gap-2.25">
                {isAi ? (
                  <AiAvatar className="size-7 shrink-0" iconSize={15} />
                ) : (
                  <OfficerAvatar className="size-7 shrink-0 text-[10px]" />
                )}
                <div
                  className="flex gap-1 rounded-xl rounded-bl-lg px-3.75 py-3.5"
                  style={{ background: C.bubbleAi }}
                >
                  <Dot />
                  <Dot delay="0.2s" />
                  <Dot delay="0.4s" />
                </div>
              </div>
            )}
          </div>

          {/* quick replies (AI only, before first user message) */}
          {showAiQuick && (
            <div className="flex shrink-0 flex-col items-start gap-2 bg-white px-3.5 pt-2 pb-0.5">
              {AI_QUICK.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => sendAi(t(q.labelKey), q.key)}
                  className="h-9.5 rounded-[11px] border-[1.5px] bg-white px-4 text-[13.5px] font-semibold transition-colors"
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
          <div className="flex shrink-0 items-center gap-2.25 border-t border-[#f1f3f5] bg-white px-3.5 py-3">
            <button
              type="button"
              aria-label={t("attachLabel")}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#8a7f70] transition-colors hover:bg-[#efe9e2]"
              style={{ background: C.field }}
            >
              <PaperclipIcon className="size-4.75" strokeWidth={1.7} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={t("placeholder")}
              className="h-11 flex-1 rounded-xl border-[1.5px] border-transparent px-4 text-sm outline-none transition-colors focus:bg-white"
              style={{ background: C.field, color: C.text }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.orange)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!canSend}
              aria-label={t("sendLabel")}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
                !canSend && "cursor-default",
              )}
              style={{
                background: canSend ? C.orange : C.sendOff,
                color: canSend ? "#fff" : C.dot,
              }}
            >
              <SendIcon className="size-4.75" />
            </button>
          </div>
        </div>
      )}

      {/* ── Loan-officer peek card + launchers (closed) ── */}
      {!open && (
        <div className="flex flex-col items-end gap-3.5">
          {/* peek card — a friendly loan-officer prompt above the launchers. */}
          <div
            className="relative w-76 max-w-[calc(100vw-40px)] animate-in rounded-2xl border border-[#eef0f2] bg-white p-4.5 shadow-[0_12px_30px_-14px_rgba(20,18,16,0.3)] duration-200 fade-in slide-in-from-bottom-2"
            style={{ color: C.text }}
          >
            <button
              type="button"
              onClick={openOfficer}
              className="block w-full text-left"
              aria-label={t("openOfficerLabel")}
            >
              <div className="flex items-center gap-2.75">
                <span className="relative shrink-0">
                  <OfficerAvatar className="size-9.5 text-sm" />
                  <OnlineDot className="-right-px -bottom-px size-2.75" />
                </span>
                <span className="text-base font-bold" style={{ color: C.text }}>
                  {t("officer.name")}
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-[#868e96]">{t("peek.greeting")}</p>
            </button>
            <div className="mt-3.5 flex gap-2">
              <a
                href={`tel:${t("peek.phone")}`}
                className="flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#eef0f2] text-sm font-bold text-[#495057] transition-colors hover:bg-[#f7f4ef]"
              >
                <PhoneIcon className="size-4 text-[#868e96]" strokeWidth={1.8} />
                {t("peek.call")}
              </a>
              <a
                href={`mailto:${t("peek.email")}`}
                className="flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#eef0f2] text-sm font-bold text-[#495057] transition-colors hover:bg-[#f7f4ef]"
              >
                <MailIcon className="size-4 text-[#868e96]" strokeWidth={1.8} />
                {t("peek.mail")}
              </a>
              <button
                type="button"
                onClick={openOfficer}
                className="flex h-9.5 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-sm font-bold text-white transition-transform hover:-translate-y-px"
                style={{ background: C.orange }}
              >
                <MessageCircleIcon className="size-4" strokeWidth={1.8} />
                {t("peek.chat")}
              </button>
            </div>
          </div>

          {/* launchers — loan officer (JM) + AI assistant */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openOfficer}
              aria-label={t("openOfficerLabel")}
              className="relative size-13 rounded-full shadow-[0_10px_24px_-8px_rgba(20,18,16,0.5)] transition-transform hover:-translate-y-0.75"
              style={{ background: C.ink }}
            >
              <span className="flex size-full items-center justify-center text-[15px] font-bold tracking-wide text-white">
                JM
              </span>
              <OnlineDot className="right-px bottom-px size-3.5 border-[3px]" />
            </button>
            <button
              type="button"
              onClick={openAi}
              aria-label={t("openAiLabel")}
              className="relative size-14 rounded-full shadow-[0_12px_28px_-8px_rgba(243,111,32,0.7)] transition-transform hover:-translate-y-0.75"
              style={{ background: C.aiGradient }}
            >
              <span className="flex size-full items-center justify-center">
                <SparklesIcon className="size-6.5 text-white" strokeWidth={1.9} />
              </span>
              {badge > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5.5 min-w-5.5 items-center justify-center rounded-full border-2 border-[#faf9f7] bg-white px-1.5 text-xs font-extrabold shadow-md"
                  style={{ color: C.orange }}
                >
                  {badge}
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Right-aligned bubble for messages the borrower sent. */
function MyBubble({ text, time }: { text: string; time: string }) {
  return (
    <div className="max-w-[86%] animate-in self-end duration-200 fade-in slide-in-from-bottom-1">
      <div
        className="rounded-xl rounded-br-lg px-3.5 py-2.75 text-sm leading-relaxed text-white"
        style={{ background: C.orange }}
      >
        {text}
      </div>
      <div className="mt-1 pr-1 text-right text-[10.5px]" style={{ color: C.time }}>
        {time}
      </div>
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
