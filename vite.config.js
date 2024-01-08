import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
const host= 'abdulme.link';
const port = 5174;
export default defineConfig({
    plugins: [  
        laravel({
            server: {
                origin: `https://${host}:${port}`
            },

            input: [ 'resources/js/app.js'],
            refresh: true,
        }),
    ],
});
