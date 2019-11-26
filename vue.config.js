const path = require('path');

const resolve = dir => path.join(__dirname, dir);

const urlPath = process.env.NODE_ENV === 'development' ? './' : '/elab-web/';

module.exports = {
    publicPath: './',
    productionSourceMap: false
};
