import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../services/api.js";
import { getPublicAiStatusRequest, sendStoreChatRequest } from "../../services/ai.service.js";

function StoreChat({ store }) {
  const slug = store?.slug;
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const status = await getPublicAiStatusRequest(slug);
        if (!cancelled) {
          setAvailable(Boolean(status.available));
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    }

    setMessages([]);
    setError("");
    setOpen(false);
    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSend(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) {
      return;
    }

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const data = await sendStoreChatRequest(slug, nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const message = getErrorMessage(err, "Could not reach the assistant");
      setError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-4">
      {open ? (
        <section className="ui-menu pointer-events-auto mb-3 flex max-h-[min(28rem,70vh)] w-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lg sm:w-96">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-soft px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{store.name} assistant</p>
              <p className="text-xs text-muted">
                {available ? "Ask about products, policies, or an order" : "Unavailable right now"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ui-btn ui-btn-ghost !px-2 !py-1"
              aria-label="Close assistant"
            >
              Close
            </button>
          </header>
          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="rounded-xl bg-soft px-3 py-2 text-sm leading-6 text-muted">
                I can search products, explain store policies, and look up an order if you share the
                email used at checkout.
              </p>
            ) : (
              messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-auto bg-brand text-white"
                      : "mr-auto bg-soft text-ink"
                  }`}
                >
                  {message.content}
                </p>
              ))
            )}
            {sending ? <p className="text-xs text-muted">Thinking...</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <form onSubmit={handleSend} className="flex gap-2 border-t border-line p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question"
              maxLength={2000}
              disabled={!available || sending}
              className="ui-input mt-0 min-w-0 flex-1"
            />
            <button
              type="submit"
              disabled={!available || sending || !input.trim()}
              className="ui-btn ui-btn-primary"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ui-btn ui-btn-ai pointer-events-auto ml-auto rounded-full px-4 py-3 shadow-md"
        aria-expanded={open}
        aria-label="Ask the store assistant"
      >
        Ask
      </button>
    </div>
  );
}

export default StoreChat;
