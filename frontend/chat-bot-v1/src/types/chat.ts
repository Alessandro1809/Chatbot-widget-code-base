export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id: string;
  isWarning?: boolean;
  isCooldown?: boolean;
  isError?: boolean;
}

export interface ChatWidgetProps {
  apiUrl?: string;
  systemPrompt?: string;
  websiteName?: string;
  availableServices?: string[];
  maxMessages?: number;
  enablePersistence?: boolean;
  theme?: 'light' | 'dark';
  accentColor?: string;
  maxActiveChats?: number;
  maxChatsPerHour?: number;
  chatCreationCooldown?: number; // segundos
  inactivityTimeout?: number; // minutos
  minMessagesForValidChat?: number;
}

export const ConnectionStatus = {
  CONNECTED :'connected',
  CONNECTING : 'connecting',
  DISCONNECTED : 'disconnected',
  ERROR : 'error'
} as const;

export interface ApiError {
  error: string;
  type: string;
  retryable: boolean;
  details?: any;
  estimatedTokens?: number;
}

// types/chat.ts - Agregar estos tipos
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: number;
  lastActivity: number;
  title?: string;
}

export interface CreditInfo {
  remaining: number;
  total: number;
  resetTime?: number;
}

export interface ApiResponse {
  reply: string;
  warning?: string;
  creditInfo?: CreditInfo;
  sessionId?: string;
}
export interface ChatLimits {
  maxActiveChats: number;
  maxChatsPerHour: number;
  chatCreationCooldown: number; // en segundos
  inactivityTimeout: number; // en minutos
  minMessagesForValidChat: number;
}

export interface ChatCreationHistory {
  timestamp: number;
  chatId: string;
}

export interface ChatSecurityManager {
  canCreateNewChat(): { allowed: boolean; reason?: string; timeRemaining?: number };
  recordChatCreation(chatId: string): void;
  cleanupInactiveChats(sessions: ChatSession[]): ChatSession[];
  getSecurityStatus(): {
    activeChats: number;
    chatsCreatedInLastHour: number;
    nextAllowedCreation?: number;
  };
}
export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];