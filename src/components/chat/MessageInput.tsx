import { useState, useRef } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 bg-white rounded-3xl shadow-lg border border-gray-100 px-4 py-3">
      <button className="text-gray-400 hover:text-indigo-500 transition-colors p-1" aria-label="Attach file">
        <Paperclip className="h-5 w-5" />
      </button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed"
        style={{ minHeight: '24px', maxHeight: '120px' }}
      />
      <button className="text-gray-400 hover:text-indigo-500 transition-colors p-1" aria-label="Voice input">
        <Mic className="h-5 w-5" />
      </button>
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        aria-label="Send message"
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full p-2 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-md"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
