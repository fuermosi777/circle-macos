const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.less$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'less-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.less'],
    // alias: {
    //   typeorm: path.resolve(__dirname, '../node_modules/typeorm/typeorm-model-shim'),
    // },
  },
  externals: {
    typeorm: "require('typeorm')",
    sqlite3: "require('sqlite3')",
  },
};
