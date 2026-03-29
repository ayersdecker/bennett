import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useAuthStore } from '../stores/authStore';
import { ChatBubble } from '../components/chat/ChatBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';

export function Home() {
  const { messages, isTyping, sendMessage } = useChat();
  const { profile } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistantName = profile?.preferences?.assistantName || 'Assistant';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-screen md:pl-64 bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{assistantName}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Hi, I'm {assistantName}. How can I help?
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Ask me anything, and I'll do my best to assist you. You can also connect services in the Connections tab.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator assistantName={assistantName} />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-20 md:pb-6 pt-3 bg-background">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSend={sendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
}
