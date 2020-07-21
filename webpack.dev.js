const path = require('path');
const merge = require('webpack-merge').merge;
const common = require('./webpack.common.js');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'source-map', //'inline-source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'openseadragon-imaginghelper.js',
		library: 'openseadragon-imaginghelper',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},
	plugins: []
});
