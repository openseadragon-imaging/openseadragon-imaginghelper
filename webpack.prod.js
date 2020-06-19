const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
//const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const execa = require('execa');

const gitHash = execa.sync('git', ['rev-parse', '--short', 'HEAD']).stdout;
//const gitNumCommits = Number(execa.sync('git', ['rev-list', 'HEAD', '--count']).stdout);
const gitDirty = execa.sync('git', ['status', '-s', '-uall']).stdout.length > 0;

const bannerOpts = {
	banner:
		process.env.npm_package_name +
		' ' +
		process.env.npm_package_version +
		' ' +
		gitHash +
		' (' +
		(gitDirty ? 'dirty' : 'clean') +
		')'
};

const minifyOpts = {
	// see https://github.com/babel/minify/tree/master/packages/babel-preset-minify#options
};

const minifyPluginOpts = {
	// see https://webpack.js.org/plugins/babel-minify-webpack-plugin/
	test: /\.js($|\?)/i,
	comments: /^\**!|@preserve|@license|@cc_on/
	//sourceMap: webpackConfig.devtool,
};

module.exports = merge(common, {
	mode: 'production',
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'openseadragon-imaginghelper.js',
		library: 'openseadragon-imaginghelper',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},
	plugins: [
		//new CleanWebpackPlugin(),
		// note MinifyPlugin needs to be before BannerPlugin or banner gets minified out
		//   (in the future, minifyPluginOpts.comments can be adjusted to preserve
		//    the banner comments)
		new MinifyPlugin(minifyOpts, minifyPluginOpts),
		new webpack.BannerPlugin(bannerOpts)
	]
});
