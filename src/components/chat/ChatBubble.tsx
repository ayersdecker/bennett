import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../stores/chatStore';
import { formatTime } from '../../lib/utils';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] lg:max-w-[60%] px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-l-3xl rounded-tr-xl'
            : 'bg-white border border-gray-100 text-gray-900 rounded-r-3xl rounded-tl-xl shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-indigo-200 text-right' : 'text-gray-400'
          }`}
        >
          {formatTime(new Date(message.timestamp))}
        </p>
      </div>
    </div>
  );
}
