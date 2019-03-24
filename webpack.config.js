const path = require('path');
const aBrowsersList = require('./package.json').browserslist || [];


/**************************************************************************************************************************************************************/
const oConfig = {
    target: 'web',
    context: path.resolve(__dirname, './src/'),
    devtool: 'cheap-module-eval-source-map',

    entry: {
        app: './js/widget/index.js',
    },

    output: {
        path: path.resolve(__dirname, './src/'), 
        publicPath: '/',
        filename: './js/chart.js'
    },

    module: {
        rules: [{ 
            test: /\.js$/,
            exclude: /[\/\\]node_modules[\/\\]/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [['@babel/preset-env', {
                        targets: {
                            browsers: aBrowsersList // For some reason it doesn't work from package.json.
                        }
                    }]],
                    cacheDirectory: true
                }
            }
        }]
    },

    resolve: { extensions: ['.js'] },
    performance: { hints: false },
    stats: { children: false }
};


/**************************************************************************************************************************************************************/
module.exports = function (env, argv) {
    const production = argv.mode === 'production';
    const oLocalConfig = Object.assign({}, oConfig);
    if (production) delete oLocalConfig.devtool;
    return oLocalConfig;
};