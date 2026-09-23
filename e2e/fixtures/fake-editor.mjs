#!/usr/bin/env node
// Stand-in editor for the open-in-editor specs: the dev server is started
// with LAUNCH_EDITOR pointing here, and every launch is appended to the file
// named by FAKE_EDITOR_LOG as one JSON line of arguments.
import fs from 'node:fs'
import process from 'node:process'

if (process.env.FAKE_EDITOR_LOG)
  fs.appendFileSync(process.env.FAKE_EDITOR_LOG, `${JSON.stringify(process.argv.slice(2))}\n`)
