import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './components/ChatWidget';

// Función para inicializar el widget
function initChatWidget(config: { apiUrl?: string; systemPrompt?: string }) {
  // Crear un contenedor para el widget si no existe
  let container = document.getElementById('ai-chat-widget-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'ai-chat-widget-container';
    document.body.appendChild(container);
  }

  // Renderizar el widget en el contenedor
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ChatWidget apiUrl={config.apiUrl} systemPrompt={config.systemPrompt} />
    </React.StrictMode>
  );

  // Devolver una función para destruir el widget
  return {
    destroy: () => {
      root.unmount();
      container?.parentNode?.removeChild(container);
    }
  };
}

// Exponer la función de inicialización en el objeto window
declare global {
  interface Window {
    AIChatWidget: {
      init: typeof initChatWidget;
    };
  }
}

// Inicializar el objeto global
window.AIChatWidget = {
  init: initChatWidget
};

// Auto-inicializar si hay un script con data-auto-init="true"
document.addEventListener('DOMContentLoaded', () => {
  const scriptTag = document.querySelector('script[data-chat-widget]');
  
  if (scriptTag && scriptTag.getAttribute('data-auto-init') === 'true') {
    const apiUrl = scriptTag.getAttribute('data-api-url');
    const systemPrompt = scriptTag.getAttribute('data-system-prompt');
    
    initChatWidget({
      apiUrl: apiUrl || undefined,
      systemPrompt: systemPrompt || undefined
    });
  }
});