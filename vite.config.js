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
  build: {
    rollupOptions: {
      output: {
        // Set 'assetFileNames' to a fixed name and path
        assetFileNames: 'K-Assistant/assests/index-[hash].css', 
        
        // Optional: you can also set specific names for JS entry files and chunks
        entryFileNames: 'K-Assistant/assests/index-[hash].js',
        // chunkFileNames: 'chunk.[hash].js', 
      }
    }
  }
})
