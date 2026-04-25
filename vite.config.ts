import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],

    base: env.VITE_BASE_URL || '/docs/',

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./src/assets', import.meta.url)),
      },
    },

    css: {
      devSourcemap: isDev,
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },

    server: {
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: Number(env.VITE_DEV_PORT) || 5173,
      open: false,
      cors: true,
      hmr: {
        overlay: true,
      },
      proxy: {
        '/admin': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 4173,
      open: false,
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProd ? 'hidden' : true,
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
                return 'vue-vendor'
              }
              if (id.includes('chart.js')) {
                return 'chart-vendor'
              }
              return 'vendor'
            }
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.names?.[0] || ''
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/i.test(info)) {
              return 'assets/css/[name]-[hash][extname]'
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },

    esbuild: isProd
      ? ({
          drop: ['console', 'debugger'],
          legalComments: 'none',
        } as Record<string, unknown>)
      : undefined,

    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'chart.js'],
      exclude: [],
    },

    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  }
})
