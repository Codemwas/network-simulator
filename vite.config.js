import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const lucideEsmPath = path.resolve(
  __dirname,
  'node_modules/lucide-react/dist/esm/lucide-react.mjs'
)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react': lucideEsmPath,
      'firebase/database': path.resolve(__dirname, 'src/firebaseDatabaseStub.js'),
      'firebase/database/*': path.resolve(__dirname, 'src/firebaseDatabaseStub.js'),
      '@firebase/database': path.resolve(
        __dirname,
        'src/firebaseFirebaseDatabaseStub.js'
      ),
      '@firebase/database/*': path.resolve(
        __dirname,
        'src/firebaseFirebaseDatabaseStub.js'
      ),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
