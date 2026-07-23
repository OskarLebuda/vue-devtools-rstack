import type { ServerResponse } from 'node:http'
import type { ConnectMiddleware } from '../middlewares/client'
import type { DevtoolsTransport } from './types'
import { createChannelHub } from './types'

export interface SseTransport extends DevtoolsTransport {
  /** Handles GET (event-stream) - mount at `${base}__vue-devtools-sse__`. */
  streamMiddleware: ConnectMiddleware
  /** Handles POST (client→server frames) - mount at `${base}__vue-devtools-send__`. */
  sendMiddleware: ConnectMiddleware
}

/**
 * SSE + POST fallback transport for environments where the HTTP server's
 * 'upgrade' event is not reachable (e.g. rsbuild middlewareMode, exotic
 * reverse proxies that drop WebSocket upgrades).
 */
export function createSseTransport(): SseTransport {
  const clients = new Set<ServerResponse>()
  const hub = createChannelHub()

  const heartbeat = setInterval(() => {
    for (const res of clients)
      res.write(': keepalive\n\n')
  }, 30_000)
  heartbeat.unref?.()

  return {
    channel: {
      send(event, payload) {
        const frame = `data: ${JSON.stringify({ event, data: payload })}\n\n`
        for (const res of clients)
          res.write(frame)
      },
      on: hub.on,
    },
    streamMiddleware(req, res) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })
      res.write(': connected\n\n')
      clients.add(res)
      req.on('close', () => clients.delete(res))
    },
    sendMiddleware(req, res) {
      let body = ''
      req.on('data', chunk => (body += chunk))
      req.on('end', () => {
        try {
          const { event, data } = JSON.parse(body)
          hub.dispatch(event, data)
        }
        catch {
          // ignore malformed frames
        }
        res.statusCode = 204
        res.end()
      })
    },
    close() {
      clearInterval(heartbeat)
      for (const res of clients)
        res.end()
      clients.clear()
    },
  }
}
