/**
 * The duck type @vue/devtools-kit needs from `setViteServerContext`:
 * it only reads `.hot` (or `.ws`) and calls `send(event, payload)` /
 * `on(event, cb)`. Payloads are SuperJSON strings produced/consumed by the
 * kit — the transport must deliver them to `on` handlers verbatim.
 */
export interface DevtoolsHotChannel {
  send: (event: string, payload: unknown) => void
  on: (event: string, cb: (data: any) => void) => void
}

export interface DevtoolsTransport {
  channel: DevtoolsHotChannel
  close: () => void
}

export interface FakeViteServer {
  hot: DevtoolsHotChannel
}

export function createFakeViteServer(channel: DevtoolsHotChannel): FakeViteServer {
  return { hot: channel }
}

/** Shared listener registry used by both WS and SSE transports. */
export function createChannelHub(): {
  dispatch: (event: string, data: any) => void
  on: DevtoolsHotChannel['on']
} {
  const listeners = new Map<string, ((data: any) => void)[]>()
  return {
    dispatch(event, data) {
      for (const cb of listeners.get(event) ?? [])
        cb(data)
    },
    on(event, cb) {
      const arr = listeners.get(event) ?? []
      arr.push(cb)
      listeners.set(event, arr)
    },
  }
}
