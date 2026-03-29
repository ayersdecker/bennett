interface TypingIndicatorProps {
  assistantName: string;
}

export function TypingIndicator({ assistantName }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-gray-100 rounded-r-3xl rounded-tl-xl shadow-sm px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">{assistantName} is typing...</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
