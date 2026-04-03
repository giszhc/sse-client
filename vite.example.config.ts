import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  build: {
    outDir: './docs',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'example/index.html'),
        simple: resolve(__dirname, 'example/simple.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // 移除入口文件的路径前缀
        preserveModules: false,
      }
    },
    sourcemap: false,
    minify: true,
    emptyOutDir: true
  },
  publicDir: '',
  base: './',
  plugins: [
    {
      name: 'copy-server',
      closeBundle() {
        // 构建完成后复制 server.ts 到 docs 目录
        const src = resolve(__dirname, 'example/server.ts')
        const dest = resolve(__dirname, 'docs/server.ts')
        
        try {
          mkdirSync(resolve(__dirname, 'docs'), { recursive: true })
          copyFileSync(src, dest)
          console.log('✅ 已复制 server.ts 到 docs 目录')
        } catch (error) {
          console.error('❌ 复制文件失败:', error)
        }
      }
    }
  ]
})
