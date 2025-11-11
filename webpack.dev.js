const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    // Disable serving static index.html from dist to ensure HtmlWebpackPlugin template is used
    static: false,
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    // Enable live reload when template or sources change
    watchFiles: ['index.html', 'src/**/*'],
  },
});
