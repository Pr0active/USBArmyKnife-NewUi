import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyPrefix = env.VITE_PROXY_PREFIX || '/api-proxy'
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://192.168.1.27:8080'
  const basePath = env.VITE_BASE_PATH || '/'

  return {
    plugins: [react()],
    base: basePath,
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
    publicDir: 'public',
    server: {
      proxy: {
        [proxyPrefix]: {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${proxyPrefix}`), ''),
          configure: (proxy) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyTarget}${proxyReq.path}`)
            })
          },
        },
      },
    },
  }
})
