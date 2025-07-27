const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/embed/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/embed'),
    filename: 'chat-widget.js',
    library: {
      name: 'ChatWidget',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this',
    clean: true
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/inline'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'chat-widget.css'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.BannerPlugin({
      banner: `
/*! 
 * ChatWidget Embeddable Script v1.0.0
 * (c) ${new Date().getFullYear()} Your Company
 * Released under MIT License
 */
      `.trim()
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false, // Mantener console.log para debugging
            drop_debugger: true
          },
          format: {
            comments: /^!/
          }
        },
        extractComments: false
      })
    ]
  },
  externals: {
    // No externalizar React para que sea completamente autocontenido
  },
  performance: {
    maxAssetSize: 500000, // 500KB
    maxEntrypointSize: 500000,
    hints: 'warning'
  },
  devtool: 'source-map'
};
