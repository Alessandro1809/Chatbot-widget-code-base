# 🤖 Chat Widget Embebible - TechSolutions Pro

Widget de chat inteligente embebible que se puede integrar en cualquier sitio web con un solo script. Construido con React 19, TypeScript y Tailwind CSS.

## 🚀 Características

- ✅ **Embebible con un solo script** - Integración simple en cualquier sitio web
- ✅ **Configuración flexible** - Múltiples métodos de configuración
- ✅ **Responsive** - Se adapta a cualquier dispositivo
- ✅ **Personalizable** - Colores, mensajes y comportamiento configurables
- ✅ **TypeScript** - Tipado completo para mejor desarrollo
- ✅ **Aislamiento completo** - No interfiere con los estilos del sitio host

## 📦 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Configuración del proyecto

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Desarrollo de la aplicación principal
npm run dev

# Construir la aplicación principal
npm run build

# Construir el widget embebible
npm run build:widget

# Construir todo (app + widget)
npm run build:all
```

### ⚙️ Variables de Entorno

El proyecto utiliza variables de entorno para configurar la URL de la API. Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

**Variables disponibles:**

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL del endpoint de la API de chat | `https://chatbot-widget-code-base.onrender.com/api/chat` |

**Ejemplo de archivo `.env`:**
```env
# API Configuration
VITE_API_URL=https://chatbot-widget-code-base.onrender.com/api/chat

# Para desarrollo local, descomenta la siguiente línea:
# VITE_API_URL=http://localhost:3001/api/chat
```

> **Nota:** Las variables de entorno con prefijo `VITE_` son accesibles en el cliente. No incluyas información sensible en estas variables.

      },
      // other options...
    },
  },
])
