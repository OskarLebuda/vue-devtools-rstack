import type { ConnectMiddleware } from './client'
import fs from 'node:fs'
import { join } from 'pathe'
import { BOOTSTRAP_FILE } from '../dirs'

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
}

/**
 * Serves the prebundled overlay bootstrap plus the upstream overlay bundle.
 * Mount at `${base}__vue-devtools__` (connect strips the mount prefix).
 */
export function createOverlayAssetsMiddleware(overlayDir: string): ConnectMiddleware {
  const files: Record<string, string> = {
    '/overlay-bootstrap.js': BOOTSTRAP_FILE,
    '/devtools-overlay.mjs': join(overlayDir, 'devtools-overlay.mjs'),
    '/devtools-overlay.css': join(overlayDir, 'devtools-overlay.css'),
  }

  return (req, res, next) => {
    const pathname = (req.url || '').split('?')[0] ?? ''
    const file = files[pathname]
    if (!file)
      return next()

    fs.readFile(file, (err, content) => {
      if (err)
        return next(err)
      const ext = pathname.slice(pathname.lastIndexOf('.'))
      res.statusCode = 200
      res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.end(content)
    })
  }
}
