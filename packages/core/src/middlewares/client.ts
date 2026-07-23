import type { IncomingMessage, ServerResponse } from 'node:http'
import type { OutgoingHttpHeaders } from 'node:http2'
import sirv from 'sirv'

export type ConnectMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void

/**
 * Serves the prebuilt DevTools client SPA. Mount at `${base}__devtools__`.
 * Mirrors upstream packages/vite/src/vite.ts configureServer (sirv single:true).
 */
export function createClientMiddleware(
  clientDir: string,
  headers?: OutgoingHttpHeaders,
): ConnectMiddleware {
  return sirv(clientDir, {
    single: true,
    dev: true,
    setHeaders(res) {
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (value !== undefined)
            res.setHeader(key, value)
        }
      }
    },
  })
}
