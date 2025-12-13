import { defineConfig } from 'vite';

export default defineConfig({
    base: '/rwat-omoteniola-ogunmuyiwa/',
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