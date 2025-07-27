import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        embed: './src/embed.tsx'
      },
      output: {
        // Configuración para el script embebido
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'embed' 
            ? 'assets/ai-chat-widget.js' 
            : 'assets/[name]-[hash].js';
        },
        manualChunks: undefined
      }
    },
    // Asegurarse de que el CSS se incluya en el bundle de JavaScript
    cssCodeSplit: false
  }
})
