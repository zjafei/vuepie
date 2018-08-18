const { join, resolve } = require('path');
const webpack = require('webpack');
const glob = require('glob');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

let entries = {};
let chunks = [];
getEntriesAndChunks();

let config = {
  entry: entries,
  output: {
    path: resolve(__dirname, './dist'),
    filename: '[name].js'
  },
  resolve: {
    // 配置别名，在项目中可缩减引用路径
    extensions: ['.js', '.vue'],
    alias: {
      components: join(__dirname, '/src/components'),
      config: join(__dirname, '/src/config'),
      service: join(__dirname, '/src/service'),
      assets: join(__dirname, '/src/assets'),
      util: join(__dirname, '/src/util')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/, // vue文件的less js 是在vueloader中定义 对应分 loader
        loader: 'vue-loader',
        options: {loaders: {
          less: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  minimize: process.env.NODE_ENV === 'production'
                }
              },
              'autoprefixer-loader',
              'less-loader'
            ]
          })
        }}
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: {
            loader: 'css-loader',
            options: {
              minimize: process.env.NODE_ENV === 'production'
            }
          }
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: process.env.NODE_ENV === 'production'
              }
            },
            'autoprefixer-loader',
            'less-loader'
          ]
        })
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            root: resolve(__dirname, 'src'),
            attrs: ['img:src', 'link:href']
          }
        }]
      },
      {
        test: /\.(png|jpe?g|gif|svg|svgz)(\?.+)?$/,
        exclude: /iconfont\.svg/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'assets/img/[name].[ext]'
          }
        }]
      },
      {
        test: /\.(eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
        include: /assets/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'assets/fonts/[name].[ext]'
          }
        }]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env.NODE_ENV)// 清除 IS_DEV is not defined
    }),
    new CommonsChunkPlugin({// name 是组的名字 minChunks 接受模块对象 返回 true 就把该模块添加到归纳组中
      name: 'vendor',
      minChunks: module => {
        return module.resource && (/node_modules/.test(module.resource) || /assets/.test(module.resource));
      }
    }),
    new CommonsChunkPlugin({
      name: 'runtime',
      minChunks: Infinity
    }),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true
    })

  ],
  devServer: {
    host: '127.0.0.1',
    port: 8010,
    historyApiFallback: false,
    noInfo: true
  },
  devtool: '#eval-source-map'
};

if (process.env.NODE_ENV === 'development') {
  config.output.publicPath = '/';
}
const pages = getHtmls();

pages.forEach(function (pathname) {
  // filename 用文件夹名字

  let fileBasename = pathname.replace('views/', '').replace('/app', '');
  var conf = {
    filename: fileBasename + '.html', // 生成的html存放路径，相对于path
    template: 'src/' + pathname + '.html' // html模板路径
  };
  if (chunks.indexOf(fileBasename) > -1) {
    conf.inject = 'body';
    conf.chunks = ['runtime', 'vendor', fileBasename];
  }
  if (process.env.NODE_ENV !== 'development') {
    conf.hash = true;
  }
  config.plugins.push(new HtmlWebpackPlugin(conf));
});

module.exports = config;

function getEntriesAndChunks () {
  glob.sync('./src/views/**/*.js').forEach(function (name) {
    var n = name.replace('./src/views/', '').replace('.js', '').replace('/app', '');
    entries[n] = [name];
    chunks.push(n);
  });
}

function getHtmls () {
  var htmls = [];
  glob.sync('./src/views/**/*.html').forEach(function (name) {
    var n = name.replace('./src/', '').replace('.html', '');
    htmls.push(n);
  });
  return htmls;
}

console.log('--------------------------------');
console.log(process.env.NODE_ENV);
console.log('--------------------------------');

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = false;
  module.exports.plugins = (module.exports.plugins || []).concat([

    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_debugger: true,
        drop_console: true
      },
      sourceMap: false,
      parallel: true
    })
  ]);
}
