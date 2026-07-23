import type { ConnectMiddleware } from './client'
import launchEditorMiddleware from 'launch-editor-middleware'

/**
 * Handles `GET {base}__open-in-editor?file=path/to/file:line:column`.
 * Under Vite this endpoint is provided by vite-plugin-vue-inspector's own
 * middleware; here we always provide it ourselves.
 */
export function createOpenInEditorMiddleware(launchEditor: string): ConnectMiddleware {
  return launchEditorMiddleware(launchEditor) as ConnectMiddleware
}
