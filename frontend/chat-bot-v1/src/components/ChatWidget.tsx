import React, { useState, useEffect, useRef } from 'react';
import { type Message, type ChatWidgetProps, ConnectionStatus, type ChatSession, type CreditInfo } from '../types/chat';
import { useChatApi } from '../hooks/useChatApi';
import { type ApiError } from '../types/chat';
import { ChatSecurityManager } from '../utils/chatSecurity';

const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiUrl = 'http://localhost:3001/api/chat',
  systemPrompt,
  websiteName,
  availableServices,
  accentColor = '#3B82F6',
  maxActiveChats = 3,
  maxChatsPerHour = 5,
  chatCreationCooldown = 30,
  inactivityTimeout = 30,
  minMessagesForValidChat = 1
}) => {
  const [open, setOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // 🔥 Estados de seguridad
  const [creationBlocked, setCreationBlocked] = useState(false);
  const [creationBlockReason, setCreationBlockReason] = useState<string>('');
  const [creationCooldown, setCreationCooldown] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 🔥 Inicializar manager de seguridad
  const securityManager = useRef<ChatSecurityManager>(
    new ChatSecurityManager({
      maxActiveChats,
      maxChatsPerHour,
      chatCreationCooldown,
      inactivityTimeout,
      minMessagesForValidChat
    })
  );

  const { 
    sendMessage, 
    resetConversationLimits, 
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
    onCooldownStart: (message, timeRemaining) => {
      if (!hasUserInteracted) return;
      addMessageToActiveChat('assistant', message, { isCooldown: true });
      startTimer(timeRemaining, false);
    },
    onInstanceLimitReached: (message, timeRemaining) => {
      if (!hasUserInteracted) return;
      setIsBlocked(true);
      startTimer(timeRemaining, true);
    }
  });

  // Obtener chat activo
  const activeChat = chatSessions.find(chat => chat.id === activeChatId);
  const messages = activeChat?.messages || [];

  // 🔥 Función mejorada para crear nuevo chat con validaciones
  const createNewChat = () => {
    // Verificar si se puede crear un nuevo chat
    const securityCheck = securityManager.current.canCreateNewChat(chatSessions);
    
    if (!securityCheck.allowed) {
      setCreationBlocked(true);
      setCreationBlockReason(securityCheck.details || 'No se puede crear un nuevo chat en este momento');
      
      if (securityCheck.timeRemaining) {
        setCreationCooldown(securityCheck.timeRemaining);
        startCreationTimer(securityCheck.timeRemaining);
      }
      
      // Mostrar mensaje temporal
      setTimeout(() => {
        if (!securityCheck.timeRemaining) {
          setCreationBlocked(false);
          setCreationBlockReason('');
        }
      }, 5000);
      
      return;
    }

    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat: ChatSession = {
      id: newChatId,
      messages: [{
        role: 'assistant',
        content: '¡Hola! ¿En qué puedo ayudarte hoy?',
        timestamp: Date.now(),
        id: `welcome_${newChatId}`
      }],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      title: 'Nueva conversación'
    };

    // 🔥 Registrar la creación en el sistema de seguridad
    securityManager.current.recordChatCreation(newChatId);

    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setInput('');
    setTyping(false);
    setCooldownTimer(0);
    setIsBlocked(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    resetConversationLimits();
  };

  // Timer para cooldown de creación
  const startCreationTimer = (seconds: number) => {
    if (creationTimerRef.current) {
      clearInterval(creationTimerRef.current);
    }

    creationTimerRef.current = setInterval(() => {
      setCreationCooldown(prev => {
        if (prev <= 1) {
          clearInterval(creationTimerRef.current!);
          setCreationBlocked(false);
          setCreationBlockReason('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-limpieza de chats inactivos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setChatSessions(prev => {
        const cleaned = securityManager.current.cleanupInactiveChats(prev);
        
        // Si el chat activo fue eliminado, cambiar al primero disponible
        if (cleaned.length !== prev.length && activeChatId) {
          const activeStillExists = cleaned.some(chat => chat.id === activeChatId);
          if (!activeStillExists && cleaned.length > 0) {
            setActiveChatId(cleaned[0].id);
          } else if (cleaned.length === 0) {
            setActiveChatId(null);
            // Crear un nuevo chat si no quedan chats válidos
            setTimeout(createNewChat, 100);
          }
        }
        
        return cleaned;
      });
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, [activeChatId]);

  // Inicializar primer chat si no existe
  useEffect(() => {
    if (chatSessions.length === 0) {
      createNewChat();
    }
  }, []);

  const addMessageToActiveChat = (role: 'user' | 'assistant', content: string, options?: {
    isWarning?: boolean;
    isCooldown?: boolean;
    isError?: boolean;
  }) => {
    if (!activeChatId) return;

    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
      id: `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...options
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === activeChatId 
        ? { 
            ...chat, 
            messages: [...chat.messages, message],
            lastActivity: Date.now(),
            title: chat.messages.length === 1 && role === 'user' 
              ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
              : chat.title
          }
        : chat
    ));
  };

  const startTimer = (seconds: number, isInstanceBlock: boolean) => {
    setCooldownTimer(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          
          if (isInstanceBlock) {
            setIsBlocked(false);
          } else {
            addMessageToActiveChat('assistant', '✅ ¡Perfecto! Ya podemos continuar nuestra conversación. ¿En qué más puedo ayudarte?');
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (creationTimerRef.current) {
        clearInterval(creationTimerRef.current);
      }
    };
  }, []);

  // Resto del código del widget permanece igual...
  // Solo agregar en el header, después del botón de lista de chats:

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

  const switchToChat = (chatId: string) => {
    setActiveChatId(chatId);
    setShowChatList(false);
  };

  const deleteChat = (chatId: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      
      if (chatId === activeChatId) {
        const newActiveId = filtered.length > 0 ? filtered[0].id : null;
        setActiveChatId(newActiveId);
        
        if (filtered.length === 0) {
          setTimeout(createNewChat, 100);
        }
      }
      
      return filtered;
    });
  };

  const handleOpenChat = () => {
    if (!isInitialized) return;
    setOpen(true);
  };

  const formatTime = (seconds: number) => 
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const isInputDisabled = typing || cooldownTimer > 0;

  // 🔥 Obtener estado de seguridad para mostrar en UI
  const securityStatus = securityManager.current.getSecurityStatus(chatSessions);

  return (
    <div className="fixed bottom-6 right-6 font-sans z-50">
      {/* Botón flotante */}
      {!open && (
        <div className="relative">
          {/* 🔥 Notificación de límite de creación de chats */}
          {creationBlocked && (
            <div className="mb-2 bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-800">Límite de chats</p>
                  <p className="text-xs text-orange-600">
                    {creationCooldown > 0 ? `Espera ${formatTime(creationCooldown)}` : creationBlockReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notificación de créditos bajos */}
          {creditInfo && creditInfo.remaining < 5 && (
            <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-yellow-800">Créditos bajos</p>
                  <p className="text-xs text-yellow-600">{creditInfo.remaining} restantes</p>
                </div>
              </div>
            </div>
          )}

          {/* Notificación de bloqueo */}
          {isBlocked && hasUserInteracted && cooldownTimer > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Límite alcanzado</p>
                  <p className="text-xs text-red-600">Espera {formatTime(cooldownTimer)}</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            className={`group relative rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
              (isBlocked && hasUserInteracted)
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
            }`}
            onClick={handleOpenChat}
            disabled={isBlocked && hasUserInteracted}
            aria-label={(isBlocked && hasUserInteracted) ? "Límite de chats alcanzado" : "Abrir chat"}
            style={!(isBlocked && hasUserInteracted) ? { backgroundColor: accentColor } : {}}
          >
            {(isBlocked && hasUserInteracted) ? (
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
          {!(isBlocked && hasUserInteracted) && (
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              connectionStatus === ConnectionStatus.CONNECTED ? 'bg-green-500' :
              connectionStatus === ConnectionStatus.CONNECTING ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-400'
            }`} />
          )}

          {/* 🔥 Contador de chats con indicador de límite */}
          {chatSessions.length > 1 && (
            <div className={`absolute -top-2 -left-2 w-6 h-6 text-white text-xs rounded-full flex items-center justify-center font-bold ${
              securityStatus.activeChats >= securityStatus.maxActiveChats ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {chatSessions.length}
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div className={`w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col mt-2 overflow-hidden transition-all duration-300 ease-out transform ${
          isMinimized ? 'h-16' : 'h-[32rem]'
        }`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center" 
               style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {activeChat?.title || 'Asistente Virtual'}
                </h3>
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
                onClick={() => setShowChatList(!showChatList)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200 relative"
                aria-label="Lista de chats"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {chatSessions.length > 1 && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center ${
                    securityStatus.activeChats >= securityStatus.maxActiveChats ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {chatSessions.length}
                  </div>
                )}
              </button>

              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200"
                aria-label={isMinimized ? "Expandir" : "Minimizar"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              
              {/* 🔥 Botón de nuevo chat con validación */}
              <button 
                onClick={createNewChat}
                disabled={creationBlocked || !securityStatus.canCreateNow}
                className={`p-1.5 rounded-lg transition-colors duration-200 ${
                  creationBlocked || !securityStatus.canCreateNow
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
                aria-label="Nuevo chat"
                title={
                  !securityStatus.canCreateNow 
                    ? `Límite alcanzado: ${securityStatus.activeChats}/${securityStatus.maxActiveChats} chats activos`
                    : "Crear nuevo chat"
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              <button
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1.5 rounded-lg transition-colors duration-200"
                aria-label="Cerrar chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 🔥 Mostrar estado de seguridad si hay límites activos */}
          {!isMinimized && (creationBlocked || securityStatus.activeChats >= securityStatus.maxActiveChats) && (
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
            <div className="bg-gray-50 border-b border-gray-200 max-h-32 overflow-y-auto">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer ${
                    chat.id === activeChatId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => switchToChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">
                        {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {/* 🔥 Indicador de actividad del chat */}
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
                        deleteChat(chat.id);
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
          )}
          
          {/* Messages area - resto del código igual */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      m.role === 'assistant' 
                        ? `${
                            m.isWarning ? 'bg-amber-50 border border-amber-200 text-amber-800' : 
                            m.isCooldown ? 'bg-orange-50 border border-orange-200 text-orange-800' : 
                            m.isError ? 'bg-red-50 border border-red-200 text-red-800' :
                            'bg-white border border-gray-200 text-gray-800'
                          }` 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    } ${m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                    style={m.role === 'user' ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : {}}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      <div className={`text-xs mt-1 ${m.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              
              {/* Input area */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey && !isInputDisabled) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        cooldownTimer > 0 ? `Esperando ${formatTime(cooldownTimer)}...` :
                        !activeChatId ? "Selecciona un chat..." :
                        "Escribe tu mensaje..."
                      }
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
                      isInputDisabled || !input.trim() || !activeChatId
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                    onClick={handleSendMessage}
                    disabled={isInputDisabled || !input.trim() || !activeChatId}
                    style={!isInputDisabled && input.trim() && activeChatId ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` } : {}}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Función de manejo de errores (igual que antes)
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