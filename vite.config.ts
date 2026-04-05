import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Настройки для разработки (то, что у тебя уже было)
  server: {
    host: '0.0.0.0',
    port: 5000,
    hmr: {
      clientPort: 5000,
    },
  },

  // ←←← НОВОЕ: Настройки для сборки второй версии
  build: {
    outDir: 'dist-v2',        // Вторая версия будет собираться сюда
    emptyOutDir: true,        // Очищать папку перед сборкой
  },
})