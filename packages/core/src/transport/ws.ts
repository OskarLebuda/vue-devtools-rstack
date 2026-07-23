import type { Server as HttpServer } from 'node:http'
import type { Http2SecureServer } from 'node:http2'
import type { DevtoolsTransport } from './types'
import { WebSocket, WebSocketServer } from 'ws'
import { createChannelHub } from './types'

export interface WsTransport extends DevtoolsTransport {
  attach: (httpServer: HttpServer | Http2SecureServer) => void
}

/**
 * Dedicated WebSocket transport for the devtools "vite" RPC channel.
 * Attached to the dev server's HTTP server via the 'upgrade' event, scoped to
 * a single pathname - other upgrades (e.g. the HMR socket) are left untouched.
 */
export function createWsTransport(wsPath: string): WsTransport {
  const wss = new WebSocketServer({ noServer: true })
  const hub = createChannelHub()

  wss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      try {
        const { event, data } = JSON.parse(String(raw))
        hub.dispatch(event, data)
      }
      catch {
        // ignore malformed frames
      }
    })
  })

  return {
    channel: {
      send(event, payload) {
        const message = JSON.stringify({ event, data: payload })
        for (const client of wss.clients) {
          if (client.readyState === WebSocket.OPEN)
            client.send(message)
        }
      },
      on: hub.on,
    },
    attach(httpServer) {
      httpServer.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
        if (pathname !== wsPath)
          return
        wss.handleUpgrade(req, socket as any, head, (ws) => {
          wss.emit('connection', ws, req)
        })
      })
    },
    close() {
      for (const client of wss.clients)
        client.terminate()
      wss.close()
    },
  }
}
