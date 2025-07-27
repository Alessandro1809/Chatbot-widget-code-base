import { initializeGlobalAPI } from './EmbedWrapper';

// Inicializar la API global cuando se carga el script
initializeGlobalAPI();

// Auto-inicialización si hay configuración en el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Buscar configuración en script tags
  const configScript = document.querySelector('script[data-chat-widget-config]');
  if (configScript) {
    try {
      const config = JSON.parse(configScript.getAttribute('data-chat-widget-config') || '{}');
      if (config.apiUrl) {
        window.ChatWidget.init(config);
      }
    } catch (error) {
      console.error('ChatWidget: Invalid configuration in data-chat-widget-config:', error);
    }
  }

  // Buscar configuración en meta tags
  const apiUrlMeta = document.querySelector('meta[name="chat-widget-api-url"]');
  if (apiUrlMeta) {
    const config: any = {
      apiUrl: apiUrlMeta.getAttribute('content') || '',
    };

    // Agregar propiedades opcionales solo si existen
    const websiteNameMeta = document.querySelector('meta[name="chat-widget-website-name"]');
    if (websiteNameMeta?.getAttribute('content')) {
      config.websiteName = websiteNameMeta.getAttribute('content');
    }

    const accentColorMeta = document.querySelector('meta[name="chat-widget-accent-color"]');
    if (accentColorMeta?.getAttribute('content')) {
      config.accentColor = accentColorMeta.getAttribute('content');
    }

    const systemPromptMeta = document.querySelector('meta[name="chat-widget-system-prompt"]');
    if (systemPromptMeta?.getAttribute('content')) {
      config.systemPrompt = systemPromptMeta.getAttribute('content');
    }

    if (config.apiUrl) {
      window.ChatWidget.init(config);
    }
  }
});

// Exportar tipos para TypeScript
export type { EmbedConfig } from './EmbedWrapper';
export { ChatWidgetEmbed } from './EmbedWrapper';
