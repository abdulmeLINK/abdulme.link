import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
const host= 'abdulme.link';
const port = 5174;
export default defineConfig({
    plugins: [  
        laravel({
            server: {
                https:true,
                host,
                port,
                   proxy: {
                '^(?!(\/\@vite|\/resources|\/node_modules))': {
                    target: `https://${host}:${port}`,
                },
                hmr: {protocol: 'https', host },
            },

            },
            input: [ 'resources/js/app.js'],
            refresh: true,
        }),
    ],
});
