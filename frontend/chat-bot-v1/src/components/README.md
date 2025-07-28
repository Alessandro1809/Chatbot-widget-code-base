# Componente ChatWidget

Este componente proporciona un widget de chat interactivo que se conecta a un backend de IA para responder preguntas basadas en el contexto de la página.

## Características

- Interfaz de usuario intuitiva con botón flotante
- Indicador de escritura animado
- Manejo de errores de conexión
- Botón para reiniciar la conversación
- Función de reconexión automática
- Estilizado con Tailwind CSS

## Uso

```jsx
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div>
      {/* Tu contenido de la aplicación */}
      
      {/* Widget de Chat con URL de API personalizada */}
      <ChatWidget apiUrl={import.meta.env.VITE_API_URL} />
    </div>
  );
}
```

## Props

| Prop | Tipo | Descripción | Valor por defecto |
|------|------|-------------|-------------------|
| apiUrl | string | URL del endpoint de la API de chat | import.meta.env.VITE_API_URL |

## Funcionamiento

El componente extrae automáticamente el contexto de la página actual (títulos h1 y h2) y lo envía junto con los mensajes del usuario al backend. El backend utiliza esta información para generar respuestas contextuales.

## Requisitos

- Un backend compatible que acepte solicitudes POST con el formato:
  ```json
  {
    "messages": [
      { "role": "user", "content": "Mensaje del usuario" }
    ],
    "pageContext": "Contexto extraído de la página"
  }
  ```

- El backend debe responder con un objeto JSON que contenga una propiedad `reply`.

## Personalización

Puedes personalizar la apariencia del widget modificando los estilos en `ChatWidget.css` o ajustando las clases de Tailwind en el componente.