const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src/imaginghelper.js'),
	externals: {
		// OpenSeadragon: {
		// 	commonjs: 'openseadragon',
		// 	commonjs2: 'openseadragon',
		// 	amd: 'openseadragon',
		// 	root: 'OpenSeadragon'
		// },
		openseadragon: 'openseadragon'
	},
	module: {
        rules: [
			{
                enforce: 'pre',
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
                use: {
                    loader: 'string-replace-loader',
                    options: {
						multiple: [
							{
								search: '<%= pkg.name %>',
								replace: process.env.npm_package_name,
								flags: 'g'
							},
							{
								search: '<%= pkg.version %>',
								replace: process.env.npm_package_version,
								flags: 'g'
							}
						]
					}
                }
			},
			{
                enforce: 'pre',
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'eslint-loader'
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
						plugins: [
							// [
							// 	require('@babel/plugin-transform-modules-commonjs'),
							// 	{
							// 		strictMode: false
							// 	}
							// ]
						],
                        presets: [
							[
								'@babel/preset-env',
								{
									modules: false,
									targets: {
										edge: '17',
										firefox: '60',
										chrome: '67',
										safari: '11.1'
									}
								}
							],
							'@babel/preset-react'
                        ]
                    }
                }
            }//,
            // {
            //     test: /\.scss$/,
            //     use: [
            //         'style-loader',
            //         'css-loader',
            //         'sass-loader'
            //     ]
            // }
        ]
    },
	plugins: [
		new CleanWebpackPlugin({
			verbose: true
		}),
	]
};
