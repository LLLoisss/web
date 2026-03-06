'use strict';

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.dev');

const compiler = webpack(config);
const devServerOptions = config.devServer || {};

const server = new WebpackDevServer(compiler, devServerOptions);

server.listen(devServerOptions.port || 3000, '0.0.0.0', (err) => {
  if (err) {
    console.error('[Dev] Server error:', err);
  } else {
    console.log(
      `[Dev] Server started at http://localhost:${
        devServerOptions.port || 3000
      }`,
    );
  }
});
