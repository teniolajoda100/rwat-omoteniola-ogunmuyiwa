import { defineConfig } from 'vite';

export default defineConfig({
    base: '/memory-game-ca2/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    }
});