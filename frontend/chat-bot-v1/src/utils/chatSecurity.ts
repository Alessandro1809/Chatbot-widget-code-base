import type { ChatSession, ChatLimits, ChatCreationHistory } from '../types/chat';

export class ChatSecurityManager {
  private limits: ChatLimits;
  private creationHistory: ChatCreationHistory[] = [];
  private lastCreationTime: number = 0;

  constructor(limits: ChatLimits) {
    this.limits = limits;
    this.loadFromStorage();
    // 🔥 Limpiar estados expirados al inicializar
    this.clearExpiredStates();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('chatWidget_security');
      if (saved) {
        const data = JSON.parse(saved);
        this.creationHistory = data.creationHistory || [];
        this.lastCreationTime = data.lastCreationTime || 0;
        
        // Limpiar historial viejo (más de 1 hora)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.creationHistory = this.creationHistory.filter(
          entry => entry.timestamp > oneHourAgo
        );
      }
    } catch (error) {
      console.warn('Error loading chat security data:', error);
      this.creationHistory = [];
      this.lastCreationTime = 0;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('chatWidget_security', JSON.stringify({
        creationHistory: this.creationHistory,
        lastCreationTime: this.lastCreationTime
      }));
    } catch (error) {
      console.warn('Error saving chat security data:', error);
    }
  }

  // 🔥 MÉTODO CRÍTICO: Limpiar estados expirados
  clearExpiredStates(): number {
    const now = Date.now();
    
    // Limpiar historial viejo
    const oneHourAgo = now - (60 * 60 * 1000);
    const originalLength = this.creationHistory.length;
    this.creationHistory = this.creationHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );
    
    // Si se limpiaron entradas, guardar
    const cleaned = originalLength - this.creationHistory.length;
    if (cleaned > 0) {
      this.saveToStorage();
    }
    
    return cleaned;
  }

  canCreateNewChat(currentSessions: ChatSession[]): { 
    allowed: boolean; 
    reason?: string; 
    timeRemaining?: number;
    details?: string;
  } {
    const now = Date.now();
    
    // 🔥 CRÍTICO: Si no hay chats, SIEMPRE permitir el primero
    if (currentSessions.length === 0) {
      return { allowed: true };
    }
    
    // 🔥 Limpiar estados expirados antes de validar
    this.clearExpiredStates();
    
    // 1. Verificar límite de chats activos
    const validChats = currentSessions.filter(chat => {
      // Contar mensajes reales del usuario (no solo del asistente)
      const userMessages = chat.messages.filter(m => m.role === 'user');
      
      return (
        userMessages.length > 0 || // Tiene al menos un mensaje del usuario
        (now - chat.createdAt) < (5 * 60 * 1000) // O fue creado hace menos de 5 minutos
      );
    });

    if (validChats.length >= this.limits.maxActiveChats) {
      return {
        allowed: false,
        reason: 'MAX_ACTIVE_CHATS',
        details: `Máximo ${this.limits.maxActiveChats} chats activos permitidos. Elimina un chat inactivo para crear uno nuevo.`
      };
    }

    // 2. Verificar cooldown entre creaciones (SOLO si ya se creó uno antes)
    if (this.lastCreationTime > 0) {
      const timeSinceLastCreation = now - this.lastCreationTime;
      const cooldownMs = this.limits.chatCreationCooldown * 1000;
      
      if (timeSinceLastCreation < cooldownMs) {
        const timeRemaining = Math.ceil((cooldownMs - timeSinceLastCreation) / 1000);
        return {
          allowed: false,
          reason: 'CREATION_COOLDOWN',
          timeRemaining,
          details: `Debes esperar ${timeRemaining} segundos antes de crear otro chat.`
        };
      }
    }

    // 3. Verificar límite por hora
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentCreations = this.creationHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );

    if (recentCreations.length >= this.limits.maxChatsPerHour) {
      const oldestRecentCreation = Math.min(...recentCreations.map(c => c.timestamp));
      const timeUntilReset = Math.ceil((oldestRecentCreation + (60 * 60 * 1000) - now) / 1000 / 60);
      
      return {
        allowed: false,
        reason: 'HOURLY_LIMIT',
        timeRemaining: timeUntilReset * 60,
        details: `Has alcanzado el límite de ${this.limits.maxChatsPerHour} chats por hora. Podrás crear otro en ${timeUntilReset} minutos.`
      };
    }

    return { allowed: true };
  }

  recordChatCreation(chatId: string) {
    const now = Date.now();
    
    this.creationHistory.push({
      timestamp: now,
      chatId
    });
    
    this.lastCreationTime = now;
    
    // Limpiar historial viejo
    const oneHourAgo = now - (60 * 60 * 1000);
    this.creationHistory = this.creationHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );
    
    this.saveToStorage();
  }

  cleanupInactiveChats(sessions: ChatSession[]): ChatSession[] {
    const now = Date.now();
    const inactivityMs = this.limits.inactivityTimeout * 60 * 1000;
    
    return sessions.filter(chat => {
      // Mantener chats con actividad reciente
      if ((now - chat.lastActivity) < inactivityMs) {
        return true;
      }
      
      // Mantener chats con mensajes reales del usuario
      const userMessages = chat.messages.filter(m => m.role === 'user');
      if (userMessages.length >= this.limits.minMessagesForValidChat) {
        return true;
      }
      
      // Eliminar chats inactivos sin contenido real
      return false;
    });
  }

  getSecurityStatus(currentSessions: ChatSession[]) {
    const now = Date.now();
    
    // 🔥 Limpiar estados expirados antes de calcular
    this.clearExpiredStates();
    
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentCreations = this.creationHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );

    const validChats = currentSessions.filter(chat => {
      // Usar la misma lógica que en canCreateNewChat
      const userMessages = chat.messages.filter(m => m.role === 'user');
      
      return (
        userMessages.length > 0 || // Tiene al menos un mensaje del usuario
        (now - chat.createdAt) < (5 * 60 * 1000) // O fue creado hace menos de 5 minutos
      );
    });

    const cooldownMs = this.limits.chatCreationCooldown * 1000;
    const timeSinceLastCreation = now - this.lastCreationTime;
    const nextAllowedCreation = (this.lastCreationTime > 0 && timeSinceLastCreation < cooldownMs)
      ? this.lastCreationTime + cooldownMs 
      : undefined;

    return {
      activeChats: validChats.length,
      maxActiveChats: this.limits.maxActiveChats,
      chatsCreatedInLastHour: recentCreations.length,
      maxChatsPerHour: this.limits.maxChatsPerHour,
      nextAllowedCreation,
      canCreateNow: this.canCreateNewChat(currentSessions).allowed
    };
  }

  // 🔥 MÉTODO MEJORADO: Reset completo
  forceReset() {
    this.creationHistory = [];
    this.lastCreationTime = 0;
    this.saveToStorage();
    
    // También limpiar el localStorage del ConversationManager
    try {
      localStorage.removeItem('chatWidget_conversationState');
    } catch (error) {
      console.warn('Error clearing conversation state:', error);
    }
  }

  // 🔥 MÉTODO NUEVO: Debug info
  getDebugInfo() {
    return {
      limits: this.limits,
      creationHistory: this.creationHistory,
      lastCreationTime: this.lastCreationTime,
      expiredStatesCleared: this.clearExpiredStates()
    };
  }
}