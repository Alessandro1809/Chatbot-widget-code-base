import React, { useState } from 'react';
import { type ChatWidgetProps, type CreditInfo } from '../types/chat';
import { useChatApi } from '../hooks/useChatApi';
import { useChatSessions } from '../hooks/useChatSessions';
import { useCooldownTimer } from '../hooks/useCooldownTimer';
import { type ApiError } from '../types/chat';

// UI Components
import NotificationBadge from './ui/NotificationBadge';
import FloatingButton from './ui/FloatingButton';
import ChatHeader from './ui/ChatHeader';
import MessageList from './ui/MessageList';
import ChatList from './ui/ChatList';
import MessageInput from './ui/MessageInput';

const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl = 'http://localhost:3001/api/chat',
  systemPrompt,
  websiteName,
  availableServices,
  accentColor = '#3B82F6',
  // Security props
  maxActiveChats = 3,
  maxChatsPerHour = 5,
  chatCreationCooldown = 30,
  inactivityTimeout = 30,
  minMessagesForValidChat = 1
}) => {
  // UI State
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Custom hooks - First initialize the API to get the real isInitialized value
  const { 
    sendMessage, 
    connectionStatus, 
    lastError,
    isInitialized
  } = useChatApi({
    apiUrl,
    systemPrompt,
    websiteName,
    availableServices,
    onLimitWarning: (warning) => {
      if (!hasUserInteracted) return;
      addMessageToActiveChat('assistant', warning, { isWarning: true });
    },
    onCooldownStart: (_, timeRemaining) => {
      if (!hasUserInteracted) return;
      startTimer(timeRemaining, false);
    },
    onInstanceLimitReached: (_, timeRemaining) => {
      if (!hasUserInteracted) return;
      // This will be handled by the cooldown timer hook after it's initialized
      setTimeout(() => {
        setBlocked(true);
        startTimer(timeRemaining, true);
      }, 0);
    }
  });

  // Now initialize chat sessions with the correct isInitialized value
  const {
    chatSessions,
    activeChatId,
    activeChat,
    creationBlock,
    securityStatus,
    createNewChat,
    addMessageToActiveChat,
    switchToChat,
    deleteChat
  } = useChatSessions({
    maxActiveChats,
    maxChatsPerHour,
    chatCreationCooldown,
    inactivityTimeout,
    minMessagesForValidChat,
    isInitialized // Use the real value from useChatApi
  });

  const {
    cooldownTimer,
    isBlocked,
    startTimer,
    setBlocked,
    formatTime
  } = useCooldownTimer({
    onTimerComplete: (isInstanceBlock) => {
      if (!isInstanceBlock) {
        addMessageToActiveChat('assistant', '✅ ¡Perfecto! Ya podemos continuar nuestra conversación. ¿En qué más puedo ayudarte?');
      }
    }
  });

  // Obtener mensajes del chat activo
  const messages = activeChat?.messages || [];

  const handleSendMessage = async () => {
    if (!input.trim() || typing || cooldownTimer > 0 || !activeChatId) return;

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    const userMessage = input.trim();
    addMessageToActiveChat('user', userMessage);
    setInput('');
    setTyping(true);

    try {
      const result = await sendMessage([...messages, {
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        id: `temp_${Date.now()}`
      }]);
      
      if (result.creditInfo) {
        setCreditInfo(result.creditInfo);
      }
      
      addMessageToActiveChat('assistant', result.reply);

      if (result.creditInfo && result.creditInfo.remaining < 10) {
        addMessageToActiveChat('assistant', 
          `⚠️ Advertencia: Te quedan ${result.creditInfo.remaining} créditos de ${result.creditInfo.total}. Considera administrar tu uso.`, 
          { isWarning: true }
        );
      }

    } catch (error) {
      const errorMessage = getErrorMessage(lastError, error as Error);
      addMessageToActiveChat('assistant', errorMessage.message, { isError: true });
      
      if (errorMessage.creditInfo) {
        setCreditInfo(errorMessage.creditInfo);
      }
    } finally {
      setTyping(false);
    }
  };

  // Handler functions
  const handleSwitchToChat = (chatId: string) => {
    switchToChat(chatId);
    setShowChatList(false);
  };

  const handleOpenChat = () => {
    if (!isInitialized) return;
    setOpen(true);
  };

  const isInputDisabled = typing || cooldownTimer > 0;

  return (
    <div className="fixed bottom-6 right-6 font-sans z-50">
      {/* Botón flotante */}
      {!open && (
        <div className="relative">
          {/* Notificación de límite de creación de chats */}
          {creationBlock.isBlocked && (
            <NotificationBadge
              type="warning"
              title="Límite de chats"
              message={
                creationBlock.cooldown > 0 
                  ? `Espera ${formatTime(creationBlock.cooldown)}` 
                  : creationBlock.reason
              }
            />
          )}

          {/* Notificación de créditos bajos */}
          {creditInfo && creditInfo.remaining < 5 && (
            <NotificationBadge
              type="info"
              title="Créditos bajos"
              message={`${creditInfo.remaining} restantes`}
            />
          )}

          {/* Notificación de bloqueo */}
          {isBlocked && hasUserInteracted && cooldownTimer > 0 && (
            <NotificationBadge
              type="error"
              title="Límite alcanzado"
              message={`Espera ${formatTime(cooldownTimer)}`}
            />
          )}
          
          <FloatingButton
            isBlocked={isBlocked}
            hasUserInteracted={hasUserInteracted}
            connectionStatus={connectionStatus}
            accentColor={accentColor}
            chatCount={chatSessions.length}
            maxActiveChats={securityStatus.maxActiveChats}
            onClick={handleOpenChat}
          />
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div className={`w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col mt-2 overflow-hidden transition-all duration-300 ease-out transform ${
          isMinimized ? 'h-16' : 'h-[32rem]'
        }`}>
          
          <ChatHeader
            title={activeChat?.title || 'Asistente Virtual'}
            connectionStatus={connectionStatus}
            cooldownTimer={cooldownTimer}
            creditInfo={creditInfo}
            accentColor={accentColor}
            chatCount={chatSessions.length}
            maxActiveChats={securityStatus.maxActiveChats}
            canCreateNewChat={securityStatus.canCreateNow}
            creationBlocked={creationBlock.isBlocked}
            isMinimized={isMinimized}
            onToggleChatList={() => setShowChatList(!showChatList)}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
            onCreateNewChat={createNewChat}
            onClose={() => setOpen(false)}
            formatTime={formatTime}
          />
          

          {/* 🔥 Mostrar estado de seguridad si hay límites activos */}
          {!isMinimized && (creationBlock.isBlocked || securityStatus.activeChats >= securityStatus.maxActiveChats) && (
            <div className="bg-orange-50 border-b border-orange-200 p-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-xs text-orange-800">
                  <span className="font-medium">
                    Chats activos: {securityStatus.activeChats}/{securityStatus.maxActiveChats}
                  </span>
                  {securityStatus.chatsCreatedInLastHour > 0 && (
                    <span className="ml-2">
                      • Creados en la última hora: {securityStatus.chatsCreatedInLastHour}/{securityStatus.maxChatsPerHour}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de chats */}
          {showChatList && !isMinimized && (
            <ChatList
              chatSessions={chatSessions}
              activeChatId={activeChatId}
              minMessagesForValidChat={minMessagesForValidChat}
              onSwitchToChat={handleSwitchToChat}
              onDeleteChat={deleteChat}
            />
          )}
          
          {/* Messages area */}
          {!isMinimized && (
            <>
              <MessageList
                messages={messages}
                typing={typing}
                accentColor={accentColor}
              />
              
              <MessageInput
                input={input}
                isInputDisabled={isInputDisabled}
                activeChatId={activeChatId}
                cooldownTimer={cooldownTimer}
                accentColor={accentColor}
                onInputChange={setInput}
                onSendMessage={handleSendMessage}
                formatTime={formatTime}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Función de manejo de errores
const getErrorMessage = (apiError: ApiError | null, error?: Error): { message: string; creditInfo?: CreditInfo } => {
  if (apiError?.type === 'QUOTA_EXCEEDED') {
    return {
      message: '💳 Has agotado tus créditos disponibles. El servicio se restablecerá según tu plan de suscripción.',
      creditInfo: { remaining: 0, total: apiError.estimatedTokens || 0 }
    };
  }

  if (apiError?.type === 'RATE_LIMIT_ERROR') {
    return {
      message: '⏱️ Has alcanzado el límite de consultas por minuto. Por favor, espera un momento antes de continuar.',
    };
  }

  if (apiError?.type === 'VALIDATION_ERROR') {
    return {
      message: '🤔 Tu mensaje contiene contenido que no puedo procesar. Por favor, reformula tu pregunta de manera diferente.',
    };
  }

  if (apiError?.type === 'NETWORK_ERROR') {
    return {
      message: '🌐 Hay un problema de conexión. Verifica tu internet e intenta nuevamente. Si el problema persiste, el servicio podría estar temporalmente no disponible.',
    };
  }

  if (apiError?.type === 'INTERNAL_ERROR') {
    return {
      message: '⚙️ Ocurrió un error interno en el servidor. Nuestro equipo ha sido notificado. Por favor, intenta nuevamente en unos minutos.',
    };
  }

  if (error?.name === 'CooldownError' || error?.name === 'InstanceLimitError') {
    return {
      message: error.message
    };
  }

  return {
    message: '😅 Algo inesperado ocurrió. Si el problema persiste, puedes crear un nuevo chat para empezar de cero.',
  };
};

export default ChatWidget;