import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // Build an additional legacy bundle (nomodule) for older browsers/old phones.
        legacy({
            // Targets can be adjusted depending on which old phones you need to support.
            targets: ['defaults', 'not IE 11'],
            // Include polyfills needed for older environments (Promise, Symbol, async/await, etc.).
            additionalLegacyPolyfills: ['core-js/stable', 'regenerator-runtime/runtime']
        })
    ],
    base: './',
    assetsInclude: ['**/*.xlsx'],
})
