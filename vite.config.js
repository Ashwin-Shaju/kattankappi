
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-uppercase-public-folder',
      closeBundle() {
        const source = resolve(process.cwd(), 'Public')
        const destination = resolve(process.cwd(), 'dist')

        if (existsSync(source)) {
          mkdirSync(destination, { recursive: true })
          cpSync(source, destination, { recursive: true })
          console.log('Copied Public assets into dist/')
        }
      },
    },
  ],
})
