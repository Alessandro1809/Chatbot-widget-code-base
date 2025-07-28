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
      container.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 20px;
        width: auto;
        height: auto;
        pointer-events: auto;
        z-index: 999999;
      `;
      document.body.appendChild(container);
    }
    
    return container;
  }

  private injectStyles(): void {
    const styleId = 'chat-widget-styles';
    if (document.getElementById(styleId)) {
      return; // Estilos ya inyectados
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Reset básico para el widget */
      #${this.config.containerId || 'chat-widget-container'} * {
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      
      /* Contenedor principal del widget */
      #${this.config.containerId || 'chat-widget-container'} {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        color: #374151 !important;
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        width: auto !important;
        height: auto !important;
      }

      /* Estilos básicos para elementos del widget */
      #${this.config.containerId || 'chat-widget-container'} button {
        background: #3B82F6 !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        width: 60px !important;
        height: 60px !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        transition: all 0.3s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 24px !important;
      }

      #${this.config.containerId || 'chat-widget-container'} button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
      }

      /* Panel del chat */
      #${this.config.containerId || 'chat-widget-container'} .chat-panel {
        position: absolute !important;
        bottom: 80px !important;
        right: 0 !important;
        width: 350px !important;
        height: 500px !important;
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
        display: none !important;
        flex-direction: column !important;
      }

      #${this.config.containerId || 'chat-widget-container'} .chat-panel.open {
        display: flex !important;
      }

      /* Utility classes */
      #${this.config.containerId || 'chat-widget-container'} .fixed { position: fixed !important; }
      #${this.config.containerId || 'chat-widget-container'} .bottom-0 { bottom: 0 !important; }
      #${this.config.containerId || 'chat-widget-container'} .right-0 { right: 0 !important; }
      #${this.config.containerId || 'chat-widget-container'} .flex { display: flex !important; }
      #${this.config.containerId || 'chat-widget-container'} .items-center { align-items: center !important; }
      #${this.config.containerId || 'chat-widget-container'} .justify-center { justify-content: center !important; }
      #${this.config.containerId || 'chat-widget-container'} .w-full { width: 100% !important; }
      #${this.config.containerId || 'chat-widget-container'} .h-full { height: 100% !important; }
      #${this.config.containerId || 'chat-widget-container'} .bg-white { background-color: #ffffff !important; }
      #${this.config.containerId || 'chat-widget-container'} .text-white { color: #ffffff !important; }
      #${this.config.containerId || 'chat-widget-container'} .rounded-lg { border-radius: 0.5rem !important; }
      #${this.config.containerId || 'chat-widget-container'} .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important; }
      #${this.config.containerId || 'chat-widget-container'} .p-4 { padding: 1rem !important; }
      #${this.config.containerId || 'chat-widget-container'} .hidden { display: none !important; }
      #${this.config.containerId || 'chat-widget-container'} .block { display: block !important; }
    `;
    
    document.head.appendChild(styleElement);
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
      this.injectStyles();
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
