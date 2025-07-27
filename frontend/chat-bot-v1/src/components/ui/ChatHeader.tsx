import React from 'react';
import { ConnectionStatus, type CreditInfo } from '../../types/chat';

interface ChatHeaderProps {
  title: string;
  connectionStatus: ConnectionStatus;
  cooldownTimer: number;
  creditInfo: CreditInfo | null;
  accentColor: string;
  chatCount: number;
  maxActiveChats: number;
  canCreateNewChat: boolean;
  creationBlocked: boolean;
  isMinimized: boolean;
  showChatList: boolean;
  onToggleChatList: () => void;
  onToggleMinimize: () => void;
  onCreateNewChat: () => void;
  onClose: () => void;
  formatTime: (seconds: number) => string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  connectionStatus,
  cooldownTimer,
  creditInfo,
  accentColor,
  chatCount,
  maxActiveChats,
  canCreateNewChat,
  creationBlocked,
  isMinimized,
  showChatList,
  onToggleChatList,
  onToggleMinimize,
  onCreateNewChat,
  onClose,
  formatTime
}) => {
  return (
    <div 
      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center" 
      style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === ConnectionStatus.CONNECTED ? 'bg-green-400' :
              connectionStatus === ConnectionStatus.CONNECTING ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className="text-xs opacity-90">
              {cooldownTimer > 0 ? `Pausa ${formatTime(cooldownTimer)}` : 'En línea'}
            </span>
            {creditInfo && (
              <span className="text-xs opacity-75">
                • {creditInfo.remaining} créditos
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Lista de chats */}
        <button 
          onClick={onToggleChatList}
          className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200 relative"
          aria-label="Lista de chats"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {chatCount > 1 && (
            <div className={`absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center ${
              chatCount >= maxActiveChats ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {chatCount}
            </div>
          )}
        </button>

        <button 
          onClick={onToggleMinimize}
          className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200"
          aria-label={isMinimized ? "Expandir" : "Minimizar"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
        </button>
        
        {/* Botón de nuevo chat con validación */}
        <button 
          onClick={onCreateNewChat}
          disabled={creationBlocked || !canCreateNewChat}
          className={`p-1.5 rounded-lg transition-colors duration-200 ${
            creationBlocked || !canCreateNewChat
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-white hover:bg-white hover:bg-opacity-20'
          }`}
          aria-label="Nuevo chat"
          title={
            !canCreateNewChat 
              ? `Límite alcanzado: ${chatCount}/${maxActiveChats} chats activos`
              : "Crear nuevo chat"
          }
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200"
          aria-label="Cerrar chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
