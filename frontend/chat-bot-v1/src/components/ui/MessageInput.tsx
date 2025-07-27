import React from 'react';

interface MessageInputProps {
  input: string;
  isInputDisabled: boolean;
  activeChatId: string | null;
  cooldownTimer: number;
  accentColor: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  formatTime: (seconds: number) => string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  input,
  isInputDisabled,
  activeChatId,
  cooldownTimer,
  accentColor,
  onInputChange,
  onSendMessage,
  formatTime
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isInputDisabled) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const getPlaceholder = () => {
    if (cooldownTimer > 0) return `Esperando ${formatTime(cooldownTimer)}...`;
    if (!activeChatId) return "Selecciona un chat...";
    return "Escribe tu mensaje...";
  };

  const canSend = !isInputDisabled && input.trim() && activeChatId;

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <input
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isInputDisabled || !activeChatId}
            maxLength={500}
          />
          
          {input.length > 400 && (
            <div className="absolute -top-6 right-0 text-xs text-gray-400">
              {input.length}/500
            </div>
          )}
        </div>
        
        <button
          className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center ${
            !canSend
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
          }`}
          onClick={onSendMessage}
          disabled={!canSend}
          style={canSend ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : {}}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
