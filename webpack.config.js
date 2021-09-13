const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	watch: true,
	mode: "production",
	entry: "./src/js/App.js",
	output: {
		filename: "./App.js"
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