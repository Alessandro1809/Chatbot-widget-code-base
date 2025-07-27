export interface ConversationLimits {
  maxMessagesPerWindow: number;
  timeWindowMs: number;
  cooldownMs: number;
  warningThreshold: number;
  maxChatInstances: number;
  instanceInactivityMs: number;
}

export interface ConversationState {
  messageCount: number;
  windowStartTime: number;
  isInCooldown: boolean;
  cooldownEndTime: number;
  lastMessageTime: number;
  activeChatInstances: Map<string, number>;
  instanceCooldownEnd: number;
  lastStateUpdate: number;
}

export interface InstanceCheckResult {
  allowed: boolean;
  reason?: 'instance_cooldown' | 'max_instances_exceeded';
  timeRemaining?: number;
  activeCount: number;
  cleanedInstances?: number;
}

export interface MessageCheckResult {
  allowed: boolean;
  reason?: 'cooldown' | 'limit_exceeded' | 'window_reset';
  timeRemaining?: number;
  messagesLeft?: number;
}

export class ConversationManager {
  private limits: ConversationLimits;
  private state: ConversationState;
  private instanceId: string;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCleanupTime: number = 0;
  private readonly CLEANUP_INTERVAL = 30000;
  private readonly SAVE_DEBOUNCE_MS = 500;
  private isRegistered: boolean = false;

  constructor(limits: Partial<ConversationLimits> = {}) {
    this.limits = {
      maxMessagesPerWindow: 10,
      timeWindowMs: 5 * 60 * 1000,
      cooldownMs: 2 * 60 * 1000,
      warningThreshold: 7,
      maxChatInstances: 999, // 🔥 Valor alto por defecto
      instanceInactivityMs: 999 * 60 * 1000, // 🔥 Valor alto por defecto
      ...limits
    };

    this.instanceId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.state = this.loadState();
    this.schedulePeriodicCleanup();
  }

  private loadState(): ConversationState {
    try {
      const saved = localStorage.getItem('chatWidget_conversationState');
      if (saved) {
        const parsed = JSON.parse(saved);
        
        let activeChatInstances: Map<string, number>;
        if (Array.isArray(parsed.activeChatInstances)) {
          activeChatInstances = new Map();
          parsed.activeChatInstances.forEach((instanceData: string) => {
            try {
              const [id, timestamp] = instanceData.split('|');
              activeChatInstances.set(id, parseInt(timestamp));
            } catch (e) {
              // Ignorar entradas malformadas
            }
          });
        } else if (parsed.activeChatInstances && typeof parsed.activeChatInstances === 'object') {
          activeChatInstances = new Map(Object.entries(parsed.activeChatInstances).map(([k, v]) => [k, Number(v)]));
        } else {
          activeChatInstances = new Map();
        }

        const now = Date.now();
        const cleanedInstances = this.cleanInactiveInstances(activeChatInstances, now);

        // 🔥 CRÍTICO: Verificar si los cooldowns realmente están activos
        const isInCooldown = parsed.isInCooldown && parsed.cooldownEndTime && now < parsed.cooldownEndTime;
        const instanceCooldownEnd = parsed.instanceCooldownEnd && now < parsed.instanceCooldownEnd ? parsed.instanceCooldownEnd : 0;

        return {
          messageCount: parsed.messageCount || 0,
          windowStartTime: parsed.windowStartTime || now,
          isInCooldown,
          cooldownEndTime: isInCooldown ? parsed.cooldownEndTime : 0,
          lastMessageTime: parsed.lastMessageTime || 0,
          activeChatInstances: cleanedInstances,
          instanceCooldownEnd,
          lastStateUpdate: now
        };
      }
    } catch (error) {
      console.warn('Error loading conversation state:', error);
    }
    return this.resetState();
  }

  private cleanInactiveInstances(instances: Map<string, number>, now: number): Map<string, number> {
    const cleaned = new Map<string, number>();
    let cleanedCount = 0;

    instances.forEach((timestamp, id) => {
      if (now - timestamp < this.limits.instanceInactivityMs) {
        cleaned.set(id, timestamp);
      } else {
        cleanedCount++;
      }
    });

    return cleaned;
  }

  private saveStateDebounced(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.saveStateImmediate();
    }, this.SAVE_DEBOUNCE_MS);
  }

  private saveStateImmediate(): void {
    try {
      const now = Date.now();
      
      if (now - this.state.lastStateUpdate < 100) {
        return;
      }

      this.state.lastStateUpdate = now;

      const stateToSave = {
        ...this.state,
        activeChatInstances: Object.fromEntries(this.state.activeChatInstances)
      };

      localStorage.setItem('chatWidget_conversationState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Error saving conversation state:', error);
    }
  }

  private resetState(): ConversationState {
    return {
      messageCount: 0,
      windowStartTime: Date.now(),
      isInCooldown: false,
      cooldownEndTime: 0,
      lastMessageTime: 0,
      activeChatInstances: new Map(),
      instanceCooldownEnd: 0,
      lastStateUpdate: Date.now()
    };
  }

  private registerInstance(): void {
    if (this.isRegistered) {
      return;
    }

    const now = Date.now();
    this.state.activeChatInstances.set(this.instanceId, now);
    this.isRegistered = true;
    this.saveStateDebounced();
  }

  private updateInstanceActivity(): void {
    if (!this.isRegistered) {
      return;
    }

    const now = Date.now();
    this.state.activeChatInstances.set(this.instanceId, now);
    this.saveStateDebounced();
  }

  private schedulePeriodicCleanup(): void {
    setInterval(() => {
      this.performPeriodicCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private performPeriodicCleanup(): void {
    const now = Date.now();
    
    if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL) {
      return;
    }

    this.lastCleanupTime = now;
    const originalSize = this.state.activeChatInstances.size;
    
    this.state.activeChatInstances = this.cleanInactiveInstances(this.state.activeChatInstances, now);
    
    if (this.state.activeChatInstances.size !== originalSize) {
      this.saveStateImmediate();
    }
  }

  // 🔥 SIMPLIFICADO: Solo retorna información, no bloquea
  canOpenNewInstance(): InstanceCheckResult {
    const now = Date.now();
    
    const originalSize = this.state.activeChatInstances.size;
    this.state.activeChatInstances = this.cleanInactiveInstances(this.state.activeChatInstances, now);
    const cleanedInstances = originalSize - this.state.activeChatInstances.size;

    // 🔥 Siempre permitir - ChatSecurityManager maneja los límites reales
    if (!this.isRegistered) {
      this.registerInstance();
    }

    return { 
      allowed: true, 
      activeCount: this.state.activeChatInstances.size,
      cleanedInstances: cleanedInstances > 0 ? cleanedInstances : undefined
    };
  }

  canSendMessage(): MessageCheckResult {
    if (this.isRegistered) {
      this.updateInstanceActivity();
    }
    
    const now = Date.now();

    // ✅ Verificar cooldown de mensajes
    if (this.state.isInCooldown) {
      if (now < this.state.cooldownEndTime) {
        const timeRemaining = Math.ceil((this.state.cooldownEndTime - now) / 1000);
        return {
          allowed: false,
          reason: 'cooldown',
          timeRemaining
        };
      } else {
        // ✅ Cooldown expirado, resetear
        this.resetMessageWindow(now);
        return {
          allowed: true,
          reason: 'window_reset',
          messagesLeft: this.limits.maxMessagesPerWindow
        };
      }
    }

    // ✅ Verificar ventana de tiempo
    if (now - this.state.windowStartTime > this.limits.timeWindowMs) {
      this.resetMessageWindow(now);
      return {
        allowed: true,
        reason: 'window_reset',
        messagesLeft: this.limits.maxMessagesPerWindow
      };
    }

    // ✅ Verificar límite de mensajes
    if (this.state.messageCount >= this.limits.maxMessagesPerWindow) {
      this.startCooldown(now);
      
      const timeRemaining = Math.ceil(this.limits.cooldownMs / 1000);
      return {
        allowed: false,
        reason: 'limit_exceeded',
        timeRemaining
      };
    }

    const messagesLeft = this.limits.maxMessagesPerWindow - this.state.messageCount;
    return { 
      allowed: true,
      messagesLeft
    };
  }

  private resetMessageWindow(now: number): void {
    this.state.messageCount = 0;
    this.state.windowStartTime = now;
    this.state.isInCooldown = false;
    this.state.cooldownEndTime = 0;
    this.saveStateDebounced();
  }

  private startCooldown(now: number): void {
    this.state.isInCooldown = true;
    this.state.cooldownEndTime = now + this.limits.cooldownMs;
    this.saveStateImmediate();
  }

  recordMessage(): { shouldWarn: boolean; messagesLeft: number } {
    if (!this.isRegistered) {
      this.registerInstance();
    }

    this.updateInstanceActivity();
    this.state.messageCount++;
    this.state.lastMessageTime = Date.now();
    this.saveStateDebounced();

    const messagesLeft = this.limits.maxMessagesPerWindow - this.state.messageCount;
    const shouldWarn = this.state.messageCount >= this.limits.warningThreshold;

    return { shouldWarn, messagesLeft };
  }

  getInstanceLimitMessage(activeCount: number, timeRemaining: number): string {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (minutes > 0) {
      return `🚫 Has alcanzado el límite de ${this.limits.maxChatInstances} chats simultáneos (${activeCount} activos). Para abrir un nuevo chat, espera ${minutes} minuto${minutes === 1 ? '' : 's'} y ${seconds} segundo${seconds === 1 ? '' : 's'}, o cierra alguno de los chats existentes.`;
    }
    return `🚫 Límite de chats alcanzado (${activeCount}/${this.limits.maxChatInstances}). Espera ${seconds} segundo${seconds === 1 ? '' : 's'} o cierra algún chat existente.`;
  }

  getWarningMessage(messagesLeft: number): string {
    if (messagesLeft <= 2) {
      return `⚠️ Solo puedes enviar ${messagesLeft} mensaje${messagesLeft === 1 ? '' : 's'} más antes de necesitar un descanso. Después podrás continuar nuestra conversación.`;
    }
    return `💡 Te quedan ${messagesLeft} mensajes en esta sesión. Si necesitas más tiempo, podremos continuar después de un breve descanso.`;
  }

  getCooldownMessage(timeRemaining: number): string {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (minutes > 0) {
      return `⏳ Para mantener una conversación de calidad, necesito un pequeño descanso. Podremos continuar en ${minutes} minuto${minutes === 1 ? '' : 's'} y ${seconds} segundo${seconds === 1 ? '' : 's'}. ¡Gracias por tu paciencia!`;
    }
    return `⏳ Solo necesito ${seconds} segundo${seconds === 1 ? '' : 's'} más para estar listo. ¡Casi terminamos!`;
  }

  resetConversation(): void {
    const now = Date.now();
    this.state.messageCount = 0;
    this.state.windowStartTime = now;
    this.state.isInCooldown = false;
    this.state.cooldownEndTime = 0;
    this.state.lastMessageTime = 0;
    
    if (this.isRegistered) {
      this.updateInstanceActivity();
    }
  }

  cleanup(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    if (this.isRegistered) {
      this.state.activeChatInstances.delete(this.instanceId);
      this.isRegistered = false;
      this.saveStateImmediate();
    }
  }

  getDebugInfo(): object {
    return {
      instanceId: this.instanceId,
      isRegistered: this.isRegistered,
      limits: this.limits,
      state: {
        ...this.state,
        activeChatInstances: Object.fromEntries(this.state.activeChatInstances)
      }
    };
  }

  forceCleanup(): number {
    const now = Date.now();
    const originalSize = this.state.activeChatInstances.size;
    this.state.activeChatInstances = this.cleanInactiveInstances(this.state.activeChatInstances, now);
    const cleaned = originalSize - this.state.activeChatInstances.size;
    
    if (cleaned > 0) {
      this.saveStateImmediate();
    }
    
    return cleaned;
  }

  forceReset(): void {
    this.state = this.resetState();
    this.isRegistered = false;
    this.saveStateImmediate();
  }
}