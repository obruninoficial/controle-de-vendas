import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Controle de Vendas — PWA 100% local/offline, sem backend.
// "base: './'" faz com que os arquivos gerados usem caminhos relativos,
// para que o app funcione tanto na raiz de um domínio quanto em um
// subcaminho (ex: GitHub Pages: usuario.github.io/nome-do-repo/).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Controle de Vendas',
        short_name: 'Controle de Vendas',
        description: 'Controle simples de produtos, clientes, vendas e fiados.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // App shell only — todos os dados ficam no IndexedDB, nunca em cache de rede.
        navigateFallback: 'index.html'
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: true
  }
})
