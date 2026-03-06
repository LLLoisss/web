'use strict';

const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const baseConfig = require('./webpack.config');

const config = merge(baseConfig, {
  mode: 'production',
  devtool: false,
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.SYS_ENV': JSON.stringify(process.env.SYS_ENV || 'SIT'),
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: ['...', new CssMinimizerPlugin()],
  },
});

webpack(config, (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(
    stats.toString({
      colors: true,
      chunks: false,
      modules: false,
      children: false,
    }),
  );
});
