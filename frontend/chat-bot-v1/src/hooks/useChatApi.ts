import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { type Message, type ApiError, type CreditInfo, ConnectionStatus } from '../types/chat.js';
import { formatPageContext, extractPageContext } from '../utils/pageContext.js';
import { ConversationManager, type InstanceCheckResult } from '../utils/conversationLimits.js';

interface UseChatApiProps {
  apiUrl: string;
  systemPrompt?: string;
  websiteName?: string;
  availableServices?: string[];
  maxRetries?: number;
  onLimitWarning?: (message: string) => void;
  onCooldownStart?: (message: string, timeRemaining: number) => void;
  onInstanceLimitReached?: (message: string, timeRemaining: number) => void;
}

export const useChatApi = ({
  apiUrl,
  systemPrompt,
  websiteName,
  availableServices,
  maxRetries = 3,
  onLimitWarning,
  onCooldownStart,
  onInstanceLimitReached
}: UseChatApiProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.CONNECTED
  );
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const [canOpenChat, setCanOpenChat] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const conversationManager = useRef<ConversationManager | null>(null);

  const initializeManager = useCallback(() => {
    if (!conversationManager.current) {
      try {
        conversationManager.current = new ConversationManager({
          maxMessagesPerWindow: 10,
          timeWindowMs: 5 * 60 * 1000,
          cooldownMs: 2 * 60 * 1000,
          warningThreshold: 7,
          // 🔥 CRÍTICO: Desactivar límites de instancias - ChatSecurityManager los maneja
          maxChatInstances: 999,
          instanceInactivityMs: 999 * 60 * 1000
        });
        setIsInitialized(true);
        return true;
      } catch (error) {
        console.error('Error initializing ConversationManager:', error);
        return false;
      }
    }
    return true;
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      initializeManager();
    }
  }, [initializeManager, isInitialized]);

  useEffect(() => {
    return () => {
      if (conversationManager.current) {
        conversationManager.current.cleanup();
      }
    };
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendMessage = useCallback(async (
    messages: Message[],
    retryCount = 0
  ): Promise<{ reply: string; warning?: string; creditInfo?: CreditInfo }> => {
    if (!conversationManager.current) {
      throw new Error('ConversationManager not initialized');
    }

    // 🔥 SOLO verificar límites de MENSAJES, no de instancias
    const limitCheck = conversationManager.current.canSendMessage();
    
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'cooldown' || limitCheck.reason === 'limit_exceeded') {
        const cooldownMessage = conversationManager.current.getCooldownMessage(limitCheck.timeRemaining!);
        onCooldownStart?.(cooldownMessage, limitCheck.timeRemaining!);
        
        const error = new Error(cooldownMessage);
        error.name = 'CooldownError';
        throw error;
      }
    }

    setConnectionStatus(ConnectionStatus.CONNECTING);
    setLastError(null);

    try {
      const pageContextData = extractPageContext();
      const pageContext = formatPageContext(pageContextData);

      const recentMessages = messages.slice(-8);
      
      const payload = {
        messages: recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        pageContext,
        systemPrompt,
        websiteName: websiteName || pageContextData.title,
        availableServices: availableServices || pageContextData.services
      };

      const { data } = await axios.post(apiUrl, payload, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { shouldWarn, messagesLeft } = conversationManager.current.recordMessage();
      
      setConnectionStatus(ConnectionStatus.CONNECTED);
      
      let warning: string | undefined;
      if (shouldWarn) {
        warning = conversationManager.current.getWarningMessage(messagesLeft);
        onLimitWarning?.(warning);
      }

      return { 
        reply: data.reply,
        warning,
        creditInfo: data.creditInfo
      };

    } catch (error) {
      if ((error as Error).name === 'CooldownError') {
        throw error;
      }

      const apiError = parseApiError(error as AxiosError);
      setLastError(apiError);

      if (apiError.retryable && retryCount < maxRetries) {
        setConnectionStatus(ConnectionStatus.CONNECTING);
        const delayMs = Math.min(Math.pow(2, retryCount) * 1000, 10000);
        await delay(delayMs);
        return sendMessage(messages, retryCount + 1);
      }

      setConnectionStatus(ConnectionStatus.ERROR);
      throw apiError;
    }
  }, [apiUrl, systemPrompt, websiteName, availableServices, maxRetries, onLimitWarning, onCooldownStart]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const healthUrl = apiUrl.replace('/api/chat', '/api/health');
      await axios.get(healthUrl, { timeout: 5000 });
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setLastError(null);
      return true;
    } catch (error) {
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
      return false;
    }
  }, [apiUrl]);

  const resetConversationLimits = useCallback(() => {
    if (conversationManager.current) {
      conversationManager.current.resetConversation();
    }
  }, []);

  // 🔥 SIMPLIFICAR - ChatSecurityManager maneja límites de instancias
  const checkInstanceLimit = useCallback((): InstanceCheckResult | null => {
    return { allowed: true, activeCount: 0 };
  }, []);

  const getDebugInfo = useCallback(() => {
    return conversationManager.current?.getDebugInfo() || null;
  }, []);

  const forceCleanup = useCallback(() => {
    return conversationManager.current?.forceCleanup() || 0;
  }, []);

  const forceReset = useCallback(() => {
    if (conversationManager.current) {
      conversationManager.current.forceReset();
      setCanOpenChat(true);
    }
  }, []);

  return {
    sendMessage,
    checkHealth,
    resetConversationLimits,
    checkInstanceLimit,
    connectionStatus,
    lastError,
    canOpenChat: true, // 🔥 Siempre true - ChatSecurityManager maneja esto
    isInitialized,
    getDebugInfo,
    forceCleanup,
    forceReset
  };
};

const parseApiError = (error: AxiosError): ApiError => {
  if (error.response?.data) {
    const apiError = error.response.data as ApiError;
    return {
      error: apiError.error || 'Error desconocido',
      type: apiError.type || 'UNKNOWN_ERROR',
      retryable: apiError.retryable || false,
      details: apiError.details,
      estimatedTokens: apiError.estimatedTokens
    };
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      error: 'Tiempo de espera agotado',
      type: 'NETWORK_ERROR',
      retryable: true
    };
  }

  if (error.code === 'ERR_NETWORK') {
    return {
      error: 'Error de conexión. Verifica tu conexión a internet.',
      type: 'NETWORK_ERROR',
      retryable: true
    };
  }

  return {
    error: 'Ha ocurrido un error inesperado',
    type: 'INTERNAL_ERROR',
    retryable: false,
    details: error.message
  };
};