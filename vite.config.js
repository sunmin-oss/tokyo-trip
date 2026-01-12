import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/tokyo-trip/",  // <--- 關鍵！一定要有這一行，且前後都要有斜線
})
