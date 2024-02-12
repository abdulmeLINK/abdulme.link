const mix = require("laravel-mix");
const path = require("path");

mix.webpackConfig({
    resolve: {
        alias: {
            // Create an alias for Xterm.js to resolve inner imports
            xterm: path.resolve(__dirname, "node_modules/xterm/lib/xterm.js"),
        },
    },
});
mix.js("resources/js/app.js", "public/js")
    .postCss("resources/css/app.css", "public/css", [
        require("postcss-import"),
        // other PostCSS plugins
    ])
    .copy("node_modules/xterm/lib/xterm.js", "public/js")
    .copy("node_modules/xterm-addon-fit/lib/xterm-addon-fit.js", "public/js")
    .copy(
        "node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js",
        "public/js"
    )
    .styles(
        [
            "node_modules/bootstrap/dist/css/bootstrap.css",
            "node_modules/xterm/css/xterm.css",
        ],
        "public/css/vendor.css"
    )
    .copy("resources/js/terminal.js", "public/js");
