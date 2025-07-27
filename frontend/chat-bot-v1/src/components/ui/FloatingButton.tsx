import React from 'react';
import { ConnectionStatus } from '../../types/chat';

interface FloatingButtonProps {
  isBlocked: boolean;
  hasUserInteracted: boolean;
  connectionStatus: ConnectionStatus;
  accentColor: string;
  chatCount: number;
  maxActiveChats: number;
  onClick: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  isBlocked,
  hasUserInteracted,
  connectionStatus,
  accentColor,
  chatCount,
  maxActiveChats,
  onClick
}) => {
  const isDisabled = isBlocked && hasUserInteracted;

  return (
    <div className="relative">
      <button
        className={`group relative rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
          isDisabled
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
        }`}
        onClick={onClick}
        disabled={isDisabled}
        aria-label={isDisabled ? "Límite de chats alcanzado" : "Abrir chat"}
        style={!isDisabled ? { backgroundColor: accentColor } : {}}
      >
        {isDisabled ? (
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
      
      {/* Indicador de conexión */}
      {!isDisabled && (
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
          connectionStatus === ConnectionStatus.CONNECTED ? 'bg-green-500' :
          connectionStatus === ConnectionStatus.CONNECTING ? 'bg-yellow-500 animate-pulse' :
          'bg-gray-400'
        }`} />
      )}

      {/* Contador de chats con indicador de límite */}
      {chatCount > 1 && (
        <div className={`absolute -top-2 -left-2 w-6 h-6 text-white text-xs rounded-full flex items-center justify-center font-bold ${
          chatCount >= maxActiveChats ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {chatCount}
        </div>
      )}
    </div>
  );
};

export default FloatingButton;
