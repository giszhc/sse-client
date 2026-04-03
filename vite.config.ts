import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'sse-client',
      fileName: 'sse-client'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    sourcemap: false,
    minify: false
  },
  resolve: {
    alias: {
      '@giszhc/sse-client': resolve(__dirname, 'src/index.ts')
    }
  }
})
