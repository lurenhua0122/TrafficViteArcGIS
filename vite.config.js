import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 定义vue的别名，如果使用其他的插件，可能会用到别名
    }
  },
  build: {
    outDir: 'dest'
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://www.zztina.top:6222'   // 代理地址
    },
    cors: true
  }
  // ,
  // hmr: { overlay: false }

})
