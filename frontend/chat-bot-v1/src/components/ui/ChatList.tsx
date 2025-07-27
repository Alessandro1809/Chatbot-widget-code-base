import React from 'react';
import { type ChatSession } from '../../types/chat';

interface ChatListProps {
  chatSessions: ChatSession[];
  activeChatId: string | null;
  minMessagesForValidChat: number;
  onSwitchToChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chatSessions,
  activeChatId,
  minMessagesForValidChat,
  onSwitchToChat,
  onDeleteChat
}) => {
  return (
    <div className="bg-gray-50 border-b border-gray-200 max-h-32 overflow-y-auto">
      {chatSessions.map((chat) => (
        <div
          key={chat.id}
          className={`flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer ${
            chat.id === activeChatId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onSwitchToChat(chat.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {chat.title}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500">
                {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {/* Indicador de actividad del chat */}
              <div className={`w-2 h-2 rounded-full ${
                chat.messages.filter(m => m.role === 'user').length >= minMessagesForValidChat
                  ? 'bg-green-400'
                  : 'bg-yellow-400'
              }`} />
            </div>
          </div>
          {chatSessions.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Eliminar chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;
