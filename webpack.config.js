require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    watch: false,
    mode: "production",
    entry: "./src/js/app.js",
    output: {
        filename: "./app.js"
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ]
    }
};