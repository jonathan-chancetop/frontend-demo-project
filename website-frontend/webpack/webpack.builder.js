import webpack from "webpack";
import autoprefixer from "autoprefixer";
import AutoDllPlugin from "autodll-webpack-plugin";
import CleanPlugin from "clean-webpack-plugin";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import HTMLPlugin from "html-webpack-plugin";
import ParallelUglifyPlugin from "webpack-parallel-uglify-plugin";

import {webpackConfig} from "./webpack.builder.conf";
import {validate} from "./webpack.validator";
import {configureDevServer} from "./webpack.builder.dev";
import {configureSprite} from "./webpack.builder.sprite";
import {configureLint} from "./webpack.builder.lint";
import {env, production, readJSON, resolve} from "./webpack.util";

export function build(config) {
    validate(config);

    configureCSSRule();
    configureAlias();
    configureDLL(config);
    configurePages(config);
    configureSprite(config);
    configureLint(config);

    if (production) {
        webpackConfig.bail = true;

        configureSystem(config);

        webpackConfig.plugins.push(
            new CleanPlugin(resolve("build"), {root: resolve("")}),
            ...productionPlugins
        );
    } else {
        configureDevServer(config);
    }

    return webpackConfig;
}

const productionPlugins = [
    new webpack.DefinePlugin({"process.env": {NODE_ENV: JSON.stringify("production")}}),
    new ParallelUglifyPlugin({
        cacheDir: resolve("node_modules/.cache/webpack-parallel-uglify-plugin"),
        sourceMap: true,
        uglifyJS: {}
    }),
    new webpack.optimize.ModuleConcatenationPlugin()
];

function configureSystem(config) {
    if (config.sys === undefined) return;

    const sys = readJSON(`conf/${env}/${config.sys}`);
    if (sys.publicPath) {
        webpackConfig.output.publicPath = sys.publicPath;
    }
}

function configureAlias() {
    webpackConfig.resolve.alias = {
        conf: resolve(`conf/${env}`),
        lib: resolve("lib")
    };
}

function configureCSSRule() {
    const cssRule = (include, modules) => ({
        test: /\.(css|less)$/,
        include: include,
        use: ExtractTextPlugin.extract({
            use: [{
                loader: "css-loader",
                options: {
                    sourceMap: true,
                    modules: modules,
                    minimize: production ? {safe: true} : false,
                    importLoaders: 2
                }
            }, {
                loader: "postcss-loader",
                options: {
                    sourceMap: true,
                    plugins: () => [autoprefixer]
                }
            }, {
                loader: "less-loader",
                options: {
                    sourceMap: true
                }
            }],
            fallback: "style-loader"    // use style-loader in development
        })
    });

    webpackConfig.module.rules.push(cssRule(resolve("src"), true));
    webpackConfig.module.rules.push(cssRule(resolve("node_modules"), false));   // not using css modules for lib less, e.g. antd less
}

function configureDLL(config) {
    Object.entries(config.lib).forEach(([name, lib]) => {
        webpackConfig.plugins.push(new AutoDllPlugin({
            context: resolve(""),
            inject: true,
            debug: true,
            filename: production ? "[name].[hash:8].js" : "[name].js",
            path: "static/js",
            plugins: production ? productionPlugins : [],
            inherit: true,
            entry: {[name]: lib}
        }));
    });
}

function configurePages(config) {
    const minify = {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
    };

    Object.entries(config.pages).forEach(([name, page]) => {
        webpackConfig.entry[name] = resolve(`src/${page.js}`);
        webpackConfig.plugins.push(new HTMLPlugin({
            filename: `${name}.html`,
            template: resolve(`src/${page.template}`),
            chunks: ["manifest", "vendor", name],
            minify: production ? minify : false
        }));
    });
}
