 import path from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    vue(), 
    tailwindcss()
  ],
  server: {
    // Allow localhost, localhost.localdomain, and all IP addresses by default.
    // You can add custom hosts to allow them.
    allowedHosts: [
      '.ngrok-free.app', // Allow a specific IP address
    ],
  },
})
