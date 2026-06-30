import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function resolveRoot(path: string) {
  return fileURLToPath(new URL(path, import.meta.url))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: resolveRoot('./index.html'),
        toastmasters: resolveRoot('./toastmasters/index.html'),
        'toastmasters-admin': resolveRoot('./toastmasters/admin/index.html'),
        'toastmasters-display': resolveRoot('./toastmasters/display/index.html'),
        'toastmasters-join': resolveRoot('./toastmasters/join/index.html'),
      },
    },
  },
})
