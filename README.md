# AI Assistant Widget

Un widget de chat con IA que puede ser fácilmente embebido en cualquier sitio web.

## Características

- Widget de chat flotante con interfaz moderna y minimalista
- Extracción automática del contexto de la página (encabezados h1, h2)
- Soporte para prompts personalizados del sistema
- Manejo de errores de conexión con opción de reconexión
- Fácil integración mediante un único script

## Estructura del Proyecto

- **backend**: Servidor Express/TypeScript con la API para comunicarse con OpenAI
- **frontend**: Aplicación React con el componente ChatWidget

## Configuración del Backend

1. Navega al directorio `backend`
2. Crea un archivo `.env` basado en `.env.example` y añade tu API key de OpenAI
3. Instala las dependencias: `npm install`
4. Inicia el servidor: `npm run dev`

## Configuración del Frontend

1. Navega al directorio `frontend/chat-bot-v1`
2. Instala las dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`
4. Para construir el script embebido: `npm run build`

## Uso del Widget Embebido

### Opción 1: Integración directa

Para integrar el widget en cualquier sitio web, simplemente añade el siguiente script:

```html
<!-- Opción 1: Auto-inicialización -->
<script 
  src="https://tu-dominio.com/assets/ai-chat-widget.js" 
  data-chat-widget 
  data-auto-init="true" 
  data-api-url="https://tu-backend.com/api/chat"
  data-system-prompt="Tu prompt personalizado aquí">
</script>

<!-- Opción 2: Inicialización manual -->
<script src="https://tu-dominio.com/assets/ai-chat-widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.AIChatWidget.init({
      apiUrl: 'https://tu-backend.com/api/chat',
      systemPrompt: 'Tu prompt personalizado aquí'
    });
  });
</script>
```

### Opción 2: Usando el script de instalación

También puedes usar nuestro script de instalación que facilita la integración y proporciona métodos adicionales para actualizar la configuración:

```html
<!-- Auto-inicialización con el script de instalación -->
<script 
  src="https://tu-dominio.com/install.js" 
  data-auto-init="true" 
  data-api-url="https://tu-backend.com/api/chat"
  data-system-prompt="Tu prompt personalizado aquí"
  data-widget-url="https://tu-dominio.com/assets/ai-chat-widget.js">
</script>

<!-- Inicialización manual con el script de instalación -->
<script src="https://tu-dominio.com/install.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const widget = window.initAIChatWidget({
      apiUrl: 'https://tu-backend.com/api/chat',
      systemPrompt: 'Tu prompt personalizado aquí',
      widgetUrl: 'https://tu-dominio.com/assets/ai-chat-widget.js'
    });
    
    // Actualizar la configuración más tarde si es necesario
    // widget.updateConfig({
    //   systemPrompt: 'Nuevo prompt personalizado'
    // });
  });
</script>
```

### Opciones de Configuración

- `data-api-url`: URL del endpoint de la API del backend
- `data-system-prompt`: Prompt personalizado del sistema para la IA
- `data-auto-init`: Si se establece en "true", el widget se inicializará automáticamente

## Personalización del Prompt del Sistema

El backend ahora acepta un prompt personalizado del sistema a través del parámetro `systemPrompt`. Esto permite adaptar el comportamiento de la IA según las necesidades específicas de cada sitio web.

Si no se proporciona un prompt personalizado, se utilizará el prompt predeterminado que incluye instrucciones para un asistente virtual embebido en sitios web.

## Licencia

MIT