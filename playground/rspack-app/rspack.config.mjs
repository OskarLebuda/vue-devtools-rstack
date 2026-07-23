import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { rspack } from '@rspack/core'
import { VueDevToolsRspackPlugin } from 'rspack-plugin-vue-devtools'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from 'rspack-plugin-vue-devtools/middleware'
import { VueLoaderPlugin } from 'vue-loader'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PLAYGROUND_RSPACK_PORT) || 3344

const devtools = new VueDevToolsRspackPlugin()
const devtoolsServer = createDevtoolsMiddlewares({
  root: __dirname,
  publicDir: path.join(__dirname, 'public'),
  distPath: path.join(__dirname, 'dist'),
  collector: devtools.collector,
})

export default {
  mode: 'development',
  context: __dirname,
  entry: { main: './src/index.js' },
  resolve: {
    extensions: ['.js', '.vue'],
    alias: { vue$: 'vue/dist/vue.runtime.esm-bundler.js' },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          // Required by vue-loader when rspack's native CSS handling is on.
          options: { experimentalInlineMatchResource: true },
        },
      },
      { test: /\.css$/, type: 'css' },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new rspack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: true,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    }),
    devtools,
  ],
  devServer: {
    port: PORT,
    historyApiFallback: true,
    onListening: () => printDevtoolsBanner(PORT),
    setupMiddlewares: (middlewares, devServer) => {
      devtoolsServer.attach(devServer.server)
      middlewares.unshift(...devtoolsServer.middlewares)
      return middlewares
    },
  },
  experiments: { css: true },
}
