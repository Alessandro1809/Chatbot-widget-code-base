import { createRoot } from 'react-dom/client';
import ChatWidget from '../components/ChatWidget';
import { type ChatWidgetProps } from '../types/chat';

// Configuración por defecto para el widget embebido
const DEFAULT_CONFIG: Partial<ChatWidgetProps> = {
  accentColor: '#3B82F6',
  maxActiveChats: 3,
  maxChatsPerHour: 5,
  chatCreationCooldown: 30,
  inactivityTimeout: 30,
  minMessagesForValidChat: 1,
};

// Interface para la configuración del script embebido
export interface EmbedConfig {
  apiUrl: string;
  websiteName?: string;
  systemPrompt?: string;
  availableServices?: string[];
  accentColor?: string;
  maxActiveChats?: number;
  maxChatsPerHour?: number;
  chatCreationCooldown?: number;
  inactivityTimeout?: number;
  minMessagesForValidChat?: number;
  containerId?: string;
}

// Clase principal para manejar el widget embebido
export class ChatWidgetEmbed {
  private container: HTMLElement | null = null;
  private root: any = null;
  private config: EmbedConfig;

  constructor(config: EmbedConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiUrl) {
      throw new Error('ChatWidget: apiUrl is required');
    }

    try {
      new URL(this.config.apiUrl);
    } catch {
      throw new Error('ChatWidget: apiUrl must be a valid URL');
    }
  }

  private createContainer(): HTMLElement {
    const containerId = this.config.containerId || 'chat-widget-container';
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      // Usar exactamente las mismas clases Tailwind que la app principal
      container.className = 'fixed bottom-6 right-6 font-sans antialiased z-50';
      container.style.cssText = `
        pointer-events: auto;
        z-index: 999999;
      `;
      document.body.appendChild(container);
    }
    
    return container;
  }

  public init(): void {
    try {
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.mount());
      } else {
        this.mount();
      }
    } catch (error) {
      console.error('ChatWidget initialization failed:', error);
    }
  }

  private mount(): void {
    try {
      this.container = this.createContainer();
      
      // Crear el root de React 18+
      this.root = createRoot(this.container);
      
      // Renderizar el widget
      this.root.render(
        <ChatWidget
          apiUrl={this.config.apiUrl}
          websiteName={this.config.websiteName}
          systemPrompt={this.config.systemPrompt}
          availableServices={this.config.availableServices}
          accentColor={this.config.accentColor}
          maxActiveChats={this.config.maxActiveChats}
          maxChatsPerHour={this.config.maxChatsPerHour}
          chatCreationCooldown={this.config.chatCreationCooldown}
          inactivityTimeout={this.config.inactivityTimeout}
          minMessagesForValidChat={this.config.minMessagesForValidChat}
        />
      );

      console.log('ChatWidget initialized successfully');
    } catch (error) {
      console.error('ChatWidget mount failed:', error);
    }
  }

  public destroy(): void {
    try {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }
      
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }
      
      // Remover estilos si no hay otros widgets
      const styleElement = document.getElementById('chat-widget-styles');
      if (styleElement) {
        styleElement.remove();
      }
      
      console.log('ChatWidget destroyed successfully');
    } catch (error) {
      console.error('ChatWidget destroy failed:', error);
    }
  }

  public updateConfig(newConfig: Partial<EmbedConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
    
    // Re-renderizar con nueva configuración
    if (this.root) {
      this.root.render(
        <ChatWidget
          apiUrl={this.config.apiUrl}
          websiteName={this.config.websiteName}
          systemPrompt={this.config.systemPrompt}
          availableServices={this.config.availableServices}
          accentColor={this.config.accentColor}
          maxActiveChats={this.config.maxActiveChats}
          maxChatsPerHour={this.config.maxChatsPerHour}
          chatCreationCooldown={this.config.chatCreationCooldown}
          inactivityTimeout={this.config.inactivityTimeout}
          minMessagesForValidChat={this.config.minMessagesForValidChat}
        />
      );
    }
  }
}

// API global para el script embebido
declare global {
  interface Window {
    ChatWidget: {
      init: (config: EmbedConfig) => ChatWidgetEmbed;
      version: string;
    };
  }
}

// Exportar la API global
export const initializeGlobalAPI = (): void => {
  window.ChatWidget = {
    init: (config: EmbedConfig) => {
      const widget = new ChatWidgetEmbed(config);
      widget.init();
      return widget;
    },
    version: '1.0.0'
  };
};
