import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [  
        laravel({
            server: {
                https:true,
                host: 'abdulme.link',
               port: 5174

            },
            input: [ 'resources/js/app.js'],
            refresh: true,
        }),
    ],
});
