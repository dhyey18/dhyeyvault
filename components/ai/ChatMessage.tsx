'use client';

import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMsg } from '@/lib/types';

export function ChatMessage({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
          ${isUser ? 'btn-primary' : 'bg-vault-card border border-vault-border'}
        `}
      >
        {isUser ? <User size={16} /> : <Bot size={16} className="text-vault-purple-light" />}
      </div>

      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-vault-purple text-white rounded-tr-sm'
            : 'glass text-vault-text rounded-tl-sm'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-purple-200' : 'text-vault-muted'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
