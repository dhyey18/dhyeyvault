'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, RefreshCw, Lightbulb } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AppShell } from '@/components/layout/AppShell';
import { ChatMessage } from '@/components/ai/ChatMessage';
import { useVault } from '@/contexts/VaultContext';
import type { ChatMessage as ChatMsg } from '@/lib/types';

const SUGGESTIONS = [
  'Summarize all my identity documents',
  'What financial documents do I have?',
  'Find documents about health or medical',
  'List all my important deadlines',
  'What documents were added recently?',
  'Help me organize my vault better',
];

const SYSTEM_GREETING: ChatMsg = {
  id: 'system-greeting',
  role: 'assistant',
  content:
    "Hello! I'm your AI vault assistant powered by Gemini 2.5 Flash. I can help you understand, summarize, and find documents in your vault. Ask me anything about your documents!",
  timestamp: new Date().toISOString(),
};

export default function AIAssistantPage() {
  const { documents } = useVault();
  const [messages, setMessages] = useState<ChatMsg[]>([SYSTEM_GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    if (!documents.length) return 'The user has no documents in their vault yet.';
    const lines = documents.map(
      (d) =>
        `- "${d.name}" (${d.category}): ${d.aiSummary || 'No summary'} [Tags: ${d.tags.join(', ') || 'none'}]`
    );
    return `The user's vault contains ${documents.length} documents:\n${lines.join('\n')}`;
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMsg = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'system-greeting')
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.content }],
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          message: text,
          context: buildContext(),
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: data.reply || 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: ChatMsg = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;
      sendMessage(text);
    }
  };

  const handleClear = () => {
    setMessages([SYSTEM_GREETING]);
  };

  return (
    <AppShell title="AI Assistant">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-vault-border bg-vault-surface/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-vault-purple/20 border border-vault-purple/30 flex items-center justify-center">
              <Bot size={15} className="text-vault-purple-light" />
            </div>
            <div>
              <p className="text-sm font-medium text-vault-text">Gemini 2.5 Flash</p>
              <p className="text-xs text-vault-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-vault-green inline-block" />
                Online · {documents.length} docs in vault
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-vault-muted hover:text-vault-text p-1.5 rounded-lg hover:bg-vault-card transition-colors flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={14} />
            Clear chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-vault-card border border-vault-border flex items-center justify-center mt-0.5">
                <Bot size={16} className="text-vault-purple-light" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-vault-muted animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 sm:px-6 pb-3">
            <p className="text-xs text-vault-muted flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} />
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 glass rounded-full text-vault-muted hover:text-vault-text hover:border-vault-purple/30 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:px-6 sm:pb-5 border-t border-vault-border"
        >
          <div className="flex gap-3 items-end glass rounded-xl px-4 py-3">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 bg-transparent text-sm text-vault-text placeholder:text-vault-muted resize-none outline-none max-h-32 overflow-y-auto leading-relaxed"
              placeholder="Ask about your documents…"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
          <p className="text-xs text-vault-muted text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </AppShell>
  );
}
