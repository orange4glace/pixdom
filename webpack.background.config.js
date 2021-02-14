const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js', 'css', 'scss' ],
    alias: {
      root: __dirname,
      lib: path.resolve(__dirname, 'lib'),
    },
    plugins: [new TsconfigPathsPlugin({/* options: see below */})]
  },
  devtool: 'inline-source-map',
  entry: './background/index.ts',
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'dist'),
  }
};