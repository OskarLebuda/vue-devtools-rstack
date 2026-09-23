import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { rspack } from '@rspack/core'
import { VueDevToolsRspackPlugin } from '@vue-devtools-rstack/rspack'
import { createDevtoolsMiddlewares, printDevtoolsBanner } from '@vue-devtools-rstack/rspack/middleware'
import { VueLoaderPlugin } from 'vue-loader'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PLAYGROUND_RSPACK_PORT) || 3344

const devtoolsServer = createDevtoolsMiddlewares({ root: __dirname })

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
    new VueDevToolsRspackPlugin(),
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
