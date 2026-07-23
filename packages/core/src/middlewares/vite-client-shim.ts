import type { ConnectMiddleware } from './client'

/**
 * The prebuilt DevTools client SPA acquires its dev-server channel through
 * `vite-hot-client`, which literally does `import(`${base}@vite/client`)` and
 * calls the module's exported `createHotContext()`. We serve a shim module at
 * that path, backed by our own WebSocket (SSE + POST fallback). Contract
 * (vite-hot-client@2.x): content-type must contain "javascript", body must not
 * start with '<', and `createHotContext` must synchronously return an object
 * with `{ on(event, cb), send(event, data) }`.
 */
export function buildViteClientShim(base: string, forceSse = false): string {
  return `// Vue DevTools rspack shim for vite-hot-client (served at ${base}@vite/client)
const BASE = ${JSON.stringify(base)};
const listeners = new Map();
let sendImpl = null;
let queue = [];
let wsFailures = 0;

function dispatch(event, data) {
  const arr = listeners.get(event);
  if (arr)
    arr.forEach((cb) => cb(data));
}

function flushQueue() {
  const pending = queue;
  queue = [];
  pending.forEach((message) => sendImpl(message));
}

function connectWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(proto + '://' + location.host + BASE + '__vue-devtools-ws__');
  ws.addEventListener('open', () => {
    wsFailures = 0;
    sendImpl = (message) => ws.send(message);
    flushQueue();
  });
  ws.addEventListener('message', (e) => {
    try {
      const { event, data } = JSON.parse(e.data);
      dispatch(event, data);
    }
    catch {}
  });
  ws.addEventListener('close', () => {
    sendImpl = null;
    wsFailures += 1;
    if (wsFailures >= 2)
      connectSse();
    else
      setTimeout(connectWs, 1000);
  });
}

function connectSse() {
  const es = new EventSource(BASE + '__vue-devtools-sse__');
  es.onmessage = (e) => {
    try {
      const { event, data } = JSON.parse(e.data);
      dispatch(event, data);
    }
    catch {}
  };
  // EventSource reconnects automatically; sends go over POST.
  sendImpl = (message) => fetch(BASE + '__vue-devtools-send__', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: message,
  });
  flushQueue();
}

${forceSse ? 'connectSse();' : 'connectWs();'}

export function createHotContext() {
  return {
    on(event, cb) {
      const arr = listeners.get(event) || [];
      arr.push(cb);
      listeners.set(event, arr);
    },
    send(event, data) {
      const message = JSON.stringify({ event, data });
      if (sendImpl)
        sendImpl(message);
      else
        queue.push(message);
    },
  };
}
`
}

/** Serves the shim. Mount at `${base}@vite/client` (exact path). */
export function createViteClientShimMiddleware(base: string, forceSse = false): ConnectMiddleware {
  const source = buildViteClientShim(base, forceSse)
  return (_req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/javascript')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(source)
  }
}
