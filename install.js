/**
 * Script de instalación para el AI Chat Widget
 * 
 * Este script facilita la integración del widget de chat en cualquier sitio web.
 * Simplemente incluye este script en tu página y configura las opciones según tus necesidades.
 */

(function() {
  // Configuración por defecto
  const defaultConfig = {
    apiUrl: 'http://localhost:3001/api/chat',
    systemPrompt: undefined,
    autoInit: true
  };

  // Función para cargar el script del widget
  function loadWidgetScript(config) {
    // Crear el elemento script
    const script = document.createElement('script');
    script.src = config.widgetUrl || 'https://tu-dominio.com/assets/ai-chat-widget.js';
    script.setAttribute('data-chat-widget', '');
    
    // Configurar atributos
    if (config.autoInit) {
      script.setAttribute('data-auto-init', 'true');
    }
    
    if (config.apiUrl) {
      script.setAttribute('data-api-url', config.apiUrl);
    }
    
    if (config.systemPrompt) {
      script.setAttribute('data-system-prompt', config.systemPrompt);
    }
    
    // Añadir el script al documento
    document.head.appendChild(script);
    
    console.log('AI Chat Widget instalado correctamente');
  }

  // Función de inicialización global
  window.initAIChatWidget = function(customConfig) {
    // Combinar la configuración por defecto con la personalizada
    const config = { ...defaultConfig, ...customConfig };
    
    // Cargar el script del widget
    loadWidgetScript(config);
    
    return {
      updateConfig: function(newConfig) {
        // Eliminar el widget existente si está inicializado
        if (window.AIChatWidget && typeof window.AIChatWidget.destroy === 'function') {
          window.AIChatWidget.destroy();
        }
        
        // Eliminar el script existente
        const existingScript = document.querySelector('script[data-chat-widget]');
        if (existingScript) {
          existingScript.parentNode.removeChild(existingScript);
        }
        
        // Cargar el widget con la nueva configuración
        loadWidgetScript({ ...config, ...newConfig });
      }
    };
  };

  // Auto-inicialización si se incluye el atributo data-auto-init en el script
  document.addEventListener('DOMContentLoaded', function() {
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    
    if (currentScript && currentScript.getAttribute('data-auto-init') === 'true') {
      const config = {
        apiUrl: currentScript.getAttribute('data-api-url') || defaultConfig.apiUrl,
        systemPrompt: currentScript.getAttribute('data-system-prompt') || defaultConfig.systemPrompt,
        widgetUrl: currentScript.getAttribute('data-widget-url')
      };
      
      window.initAIChatWidget(config);
    }
  });
})();