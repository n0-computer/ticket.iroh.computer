// Tests need this file to exist. This file exising causes next.js build to explode.
// It's a great day for magical javascript.
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};