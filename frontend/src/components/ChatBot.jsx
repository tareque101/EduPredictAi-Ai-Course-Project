import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Copy, Loader2, MessageCircle, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { sendChatMessage } from '../api/client.js';

const STORAGE_KEY = 'edupredict_chat_v1';
const MAX_HISTORY = 10;
const MAX_CHARS = 1000;

const QUICK_PROMPTS = [
  'How can I improve my CGPA?',
  'Build a weekly revision plan',
  'Tips for better sleep',
  'Prepare for my exams',
];

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm your EduPredict study assistant. Ask me about study planning, sleep, attendance, ECA, skills or exam preparation.",
  time: null,
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const timeLabel = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const shortModel = (id) => (id ? id.split('/').pop().replace(/:free$/, '') : '');

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // Corrupted storage: start a fresh conversation
  }
  return [WELCOME];
}

// Only real turns are sent as context: no welcome message, no error bubbles.
function buildHistory(list) {
  return list
    .filter((m) => m.id !== 'welcome' && !m.error && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.text }));
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const inFlight = useRef(false);
  const endRef = useRef(null);

  // Persist the conversation in this browser only
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // Storage full or disabled: the chat still works in memory
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open]);

  const showSuggestions = messages.length === 1 && messages[0].id === 'welcome';

  const requestReply = async (text, history) => {
    inFlight.current = true;
    setLoading(true);
    try {
      const data = await sendChatMessage(text, history);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', text: data.reply, time: new Date().toISOString(), model: data.model },
      ]);
    } catch (err) {
      const errText =
        err.code === 'ECONNABORTED'
          ? 'The assistant took too long to reply. Please try again.'
          : err.response?.data?.error ||
            'Cannot reach the assistant. Make sure the backend is running on port 5000.';
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          error: true,
          text: errText,
          time: new Date().toISOString(),
          retry: { text, history },
        },
      ]);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const send = (rawText) => {
    const text = rawText.trim().slice(0, MAX_CHARS);
    if (!text || inFlight.current) return; // blocks duplicate submits
    const history = buildHistory(messages);
    setMessages((prev) => [...prev, { id: uid(), role: 'user', text, time: new Date().toISOString() }]);
    setInput('');
    requestReply(text, history);
  };

  const retry = (errMsg) => {
    if (inFlight.current || !errMsg.retry) return;
    setMessages((prev) => prev.filter((m) => m.id !== errMsg.id));
    requestReply(errMsg.retry.text, errMsg.retry.history);
  };

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard blocked by the browser
    }
  };

  const clearChat = () => {
    if (inFlight.current) return;
    setMessages([WELCOME]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift + Enter inserts a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[520px] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Study Assistant</p>
                <p className="text-xs text-indigo-100">{loading ? 'Typing...' : 'Always here to help'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                disabled={loading}
                className="rounded-md p-1.5 hover:bg-white/20 disabled:opacity-40"
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 hover:bg-white/20"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : m.error
                      ? 'rounded-bl-sm border border-rose-200 bg-rose-50 text-rose-700'
                      : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m.text}
                </div>

                <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
                  {timeLabel(m.time) && <span>{timeLabel(m.time)}</span>}
                  {m.role === 'assistant' && m.model && <span>via {shortModel(m.model)}</span>}
                  {m.role === 'assistant' && !m.error && m.id !== 'welcome' && (
                    <button onClick={() => copy(m)} className="inline-flex items-center gap-1 hover:text-indigo-600">
                      {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedId === m.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                  {m.error && m.retry && (
                    <button
                      onClick={() => retry(m)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline disabled:opacity-40"
                    >
                      <RotateCcw className="h-3 w-3" /> Retry
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && <TypingBubble />}
            <div ref={endRef} />
          </div>

          {/* Suggested prompts (only before the first question) */}
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-4 py-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  disabled={loading}
                  className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about your studies..."
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((p) => !p)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg transition hover:scale-105"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}