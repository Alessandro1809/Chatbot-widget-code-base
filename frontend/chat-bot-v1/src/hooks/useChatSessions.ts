import { useState, useEffect, useRef, useCallback } from 'react';
import { type ChatSession, type Message } from '../types/chat';
import { ChatSecurityManager } from '../utils/chatSecurity';

interface UseChatSessionsProps {
  maxActiveChats: number;
  maxChatsPerHour: number;
  chatCreationCooldown: number;
  inactivityTimeout: number;
  minMessagesForValidChat: number;
  isInitialized: boolean;
}

interface CreationBlockState {
  isBlocked: boolean;
  reason: string;
  cooldown: number;
}

export const useChatSessions = ({
  maxActiveChats,
  maxChatsPerHour,
  chatCreationCooldown,
  inactivityTimeout,
  minMessagesForValidChat,
  isInitialized
}: UseChatSessionsProps) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [creationBlock, setCreationBlock] = useState<CreationBlockState>({
    isBlocked: false,
    reason: '',
    cooldown: 0
  });

  const creationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const securityManager = useRef<ChatSecurityManager>(
    new ChatSecurityManager({
      maxActiveChats,
      maxChatsPerHour,
      chatCreationCooldown,
      inactivityTimeout,
      minMessagesForValidChat
    })
  );

  // Obtener chat activo
  const activeChat = chatSessions.find(chat => chat.id === activeChatId);

  // Función para crear el primer chat (sin registrar en security manager)
  const createInitialChat = useCallback(() => {
    // CRÍTICO: Limpiar completamente el estado de seguridad para el chat inicial
    securityManager.current.forceReset();
    
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

    // NO registrar en security manager para el chat inicial
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    
    // Asegurar que el estado de bloqueo esté limpio
    setCreationBlock({ isBlocked: false, reason: '', cooldown: 0 });
  }, []);

  // Función para crear nuevo chat (con validaciones de seguridad)
  const createNewChat = useCallback(() => {
    const securityCheck = securityManager.current.canCreateNewChat(chatSessions);
    
    if (!securityCheck.allowed) {
      setCreationBlock({
        isBlocked: true,
        reason: securityCheck.details || 'No se puede crear un nuevo chat en este momento',
        cooldown: securityCheck.timeRemaining || 0
      });
      
      if (securityCheck.timeRemaining) {
        startCreationTimer(securityCheck.timeRemaining);
      } else {
        setTimeout(() => {
          setCreationBlock(prev => ({ ...prev, isBlocked: false, reason: '' }));
        }, 5000);
      }
      
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

    // SÍ registrar en security manager para chats creados por el usuario
    securityManager.current.recordChatCreation(newChatId);
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    
    // Limpiar estado de bloqueo
    setCreationBlock({ isBlocked: false, reason: '', cooldown: 0 });
  }, [chatSessions]);

  // Timer para cooldown de creación
  const startCreationTimer = useCallback((seconds: number) => {
    if (creationTimerRef.current) {
      clearInterval(creationTimerRef.current);
    }
    
    setCreationBlock(prev => ({ ...prev, cooldown: seconds }));

    creationTimerRef.current = setInterval(() => {
      setCreationBlock(prev => {
        if (prev.cooldown <= 1) {
          clearInterval(creationTimerRef.current!);
          return { isBlocked: false, reason: '', cooldown: 0 };
        }
        return { ...prev, cooldown: prev.cooldown - 1 };
      });
    }, 1000);
  }, []);

  // Agregar mensaje al chat activo
  const addMessageToActiveChat = useCallback((
    role: 'user' | 'assistant', 
    content: string, 
    options?: { isWarning?: boolean; isCooldown?: boolean; isError?: boolean; }
  ) => {
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
  }, [activeChatId]);

  // Cambiar chat activo
  const switchToChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  // Eliminar chat
  const deleteChat = useCallback((chatId: string) => {
    setChatSessions(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      
      if (chatId === activeChatId) {
        const newActiveId = filtered.length > 0 ? filtered[0].id : null;
        setActiveChatId(newActiveId);
        
        if (filtered.length === 0) {
          setTimeout(createInitialChat, 100);
        }
      }
      
      return filtered;
    });
  }, [activeChatId, createNewChat, createInitialChat]);

  // Auto-limpieza de chats inactivos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setChatSessions(prev => {
        const cleaned = securityManager.current.cleanupInactiveChats(prev);
        
        if (cleaned.length !== prev.length && activeChatId) {
          const activeStillExists = cleaned.some(chat => chat.id === activeChatId);
          if (!activeStillExists && cleaned.length > 0) {
            setActiveChatId(cleaned[0].id);
          } else if (cleaned.length === 0) {
            setActiveChatId(null);
            setTimeout(createInitialChat, 100);
          }
        }
        
        return cleaned;
      });
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(cleanupInterval);
  }, [activeChatId, createNewChat, createInitialChat]);

  // Inicializar primer chat
  useEffect(() => {
    if (chatSessions.length === 0 && isInitialized) {
      setTimeout(() => {
        createInitialChat();
      }, 100);
    }
  }, [chatSessions.length, isInitialized, createInitialChat]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (creationTimerRef.current) {
        clearInterval(creationTimerRef.current);
      }
    };
  }, []);

  // Obtener estado de seguridad
  const securityStatus = securityManager.current.getSecurityStatus(chatSessions);

  return {
    chatSessions,
    activeChatId,
    activeChat,
    creationBlock,
    securityStatus,
    createNewChat,
    addMessageToActiveChat,
    switchToChat,
    deleteChat
  };
};
