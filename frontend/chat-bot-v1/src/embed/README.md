# ChatWidget - Script Embebido

Un widget de chat inteligente que puede ser integrado fácilmente en cualquier sitio web.

## 🚀 Instalación Rápida

### Método 1: Script Tag (Recomendado)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Sitio Web</title>
</head>
<body>
    <!-- Tu contenido aquí -->
    
    <!-- ChatWidget Script -->
    <script src="https://tu-cdn.com/chat-widget.js"></script>
    <script>
        ChatWidget.init({
            apiUrl: 'https://tu-api.com/chat',
            websiteName: 'Mi Sitio Web',
            accentColor: '#3B82F6'
        });
    </script>
</body>
</html>
```

### Método 2: Configuración con Meta Tags

```html
<head>
    <meta name="chat-widget-api-url" content="https://tu-api.com/chat">
    <meta name="chat-widget-website-name" content="Mi Sitio Web">
    <meta name="chat-widget-accent-color" content="#FF6B6B">
    <meta name="chat-widget-system-prompt" content="Eres un asistente útil para mi sitio web.">
</head>
<body>
    <script src="https://tu-cdn.com/chat-widget.js"></script>
    <!-- Se inicializa automáticamente con las meta tags -->
</body>
```

### Método 3: Configuración con Data Attributes

```html
<script 
    src="https://tu-cdn.com/chat-widget.js"
    data-chat-widget-config='{"apiUrl":"https://tu-api.com/chat","websiteName":"Mi Sitio","accentColor":"#10B981"}'>
</script>
```

## ⚙️ Configuración

### Opciones Disponibles

| Opción | Tipo | Requerido | Default | Descripción |
|--------|------|-----------|---------|-------------|
| `apiUrl` | string | ✅ | - | URL de tu API de chat |
| `websiteName` | string | ❌ | - | Nombre de tu sitio web |
| `systemPrompt` | string | ❌ | - | Prompt del sistema para el AI |
| `availableServices` | string[] | ❌ | - | Servicios disponibles |
| `accentColor` | string | ❌ | '#3B82F6' | Color principal del widget |
| `maxActiveChats` | number | ❌ | 3 | Máximo de chats activos |
| `maxChatsPerHour` | number | ❌ | 5 | Límite de chats por hora |
| `chatCreationCooldown` | number | ❌ | 30 | Cooldown entre chats (segundos) |
| `inactivityTimeout` | number | ❌ | 30 | Timeout de inactividad (minutos) |
| `minMessagesForValidChat` | number | ❌ | 1 | Mensajes mínimos para chat válido |
| `containerId` | string | ❌ | 'chat-widget-container' | ID del contenedor |

### Ejemplo Completo

```javascript
const widget = ChatWidget.init({
    // Configuración requerida
    apiUrl: 'https://api.miempresa.com/chat',
    
    // Personalización
    websiteName: 'Mi Empresa',
    systemPrompt: 'Eres un asistente de atención al cliente para Mi Empresa. Ayuda a los usuarios con sus consultas de manera amable y profesional.',
    accentColor: '#8B5CF6',
    
    // Límites de seguridad
    maxActiveChats: 5,
    maxChatsPerHour: 10,
    chatCreationCooldown: 60,
    inactivityTimeout: 45,
    
    // Servicios disponibles
    availableServices: [
        'Soporte técnico',
        'Ventas',
        'Información general'
    ]
});
```

## 🎨 Personalización de Estilos

### Colores Personalizados

```javascript
ChatWidget.init({
    apiUrl: 'https://tu-api.com/chat',
    accentColor: '#FF6B6B', // Color principal
    // El widget se adapta automáticamente
});
```

### CSS Personalizado

```css
/* Personalizar el botón flotante */
#chat-widget-container .floating-button {
    bottom: 20px !important;
    right: 20px !important;
}

/* Personalizar el tamaño del widget */
#chat-widget-container .chat-window {
    width: 400px !important;
    height: 600px !important;
}
```

## 📱 Responsive Design

El widget es completamente responsive y se adapta automáticamente a:
- Desktop (ventana flotante)
- Tablet (ventana adaptativa)
- Mobile (pantalla completa)

## 🔧 API Programática

### Métodos Disponibles

```javascript
// Inicializar el widget
const widget = ChatWidget.init(config);

// Actualizar configuración
widget.updateConfig({
    accentColor: '#10B981',
    websiteName: 'Nuevo Nombre'
});

// Destruir el widget
widget.destroy();

// Obtener versión
console.log(ChatWidget.version); // "1.0.0"
```

### Eventos del Widget

```javascript
// Escuchar cuando el widget se abre
document.addEventListener('chatWidgetOpened', (event) => {
    console.log('Widget abierto');
});

// Escuchar cuando se envía un mensaje
document.addEventListener('chatWidgetMessageSent', (event) => {
    console.log('Mensaje enviado:', event.detail.message);
});
```

## 🔒 Seguridad

### Características de Seguridad Incluidas

- ✅ Límite de chats activos por usuario
- ✅ Límite de chats por hora
- ✅ Cooldown entre creación de chats
- ✅ Timeout por inactividad
- ✅ Validación de mensajes
- ✅ Sanitización de contenido

### Configuración de Seguridad

```javascript
ChatWidget.init({
    apiUrl: 'https://tu-api.com/chat',
    
    // Configuración de seguridad estricta
    maxActiveChats: 2,
    maxChatsPerHour: 3,
    chatCreationCooldown: 120, // 2 minutos
    inactivityTimeout: 15,     // 15 minutos
    minMessagesForValidChat: 2
});
```

## 🌐 Compatibilidad

### Navegadores Soportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Frameworks Compatibles
- ✅ Vanilla HTML/JS
- ✅ WordPress
- ✅ Shopify
- ✅ Wix
- ✅ Squarespace
- ✅ React (como componente)
- ✅ Vue.js
- ✅ Angular

## 🚨 Solución de Problemas

### Problemas Comunes

**El widget no aparece:**
```javascript
// Verificar que la configuración sea correcta
console.log(ChatWidget.version);

// Verificar errores en la consola
// Asegurar que apiUrl sea válida
```

**Conflictos de CSS:**
```css
/* Aumentar especificidad si es necesario */
#chat-widget-container .mi-clase {
    color: red !important;
}
```

**Problemas de CORS:**
```javascript
// Asegurar que tu API permita el dominio
// Configurar headers CORS correctamente
```

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@tuempresa.com
- 📚 Documentación: https://docs.tuempresa.com/chat-widget
- 🐛 Issues: https://github.com/tuempresa/chat-widget/issues

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.
