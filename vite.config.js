import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/soop-img': {
        target: 'https://profile.img.sooplive.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-img/, ''),
      },
      '/poong-api': {
        target: 'https://static.poong.today',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/poong-api/, ''),
        headers: {
          'Referer': 'https://poong.today/',
          'Origin': 'https://poong.today',
        },
      },
      '/soop-live': {
        target: 'https://live.sooplive.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-live/, ''),
      },
      '/soop-chapi': {
        target: 'https://chapi.sooplive.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-chapi/, ''),
        headers: {
          'Referer': 'https://www.sooplive.co.kr/',
        },
      },
      '/soop-thumb': {
        target: 'https://liveimg.sooplive.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop-thumb/, ''),
      },
    },
  },
})
