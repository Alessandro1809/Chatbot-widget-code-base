import React, { useRef, useEffect } from 'react';
import { type Message } from '../../types/chat';

interface MessageListProps {
  messages: Message[];
  typing: boolean;
  accentColor: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, typing, accentColor }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll al final
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
            message.role === 'assistant' 
              ? `${
                  message.isWarning ? 'bg-amber-50 border border-amber-200 text-amber-800' : 
                  message.isCooldown ? 'bg-orange-50 border border-orange-200 text-orange-800' : 
                  message.isError ? 'bg-red-50 border border-red-200 text-red-800' :
                  'bg-white border border-gray-200 text-gray-800'
                }` 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          } ${message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={message.role === 'user' ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : {}}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      
      {typing && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" 
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default MessageList;
