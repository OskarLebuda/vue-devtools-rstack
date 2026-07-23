declare module 'launch-editor-middleware' {
  import type { IncomingMessage, ServerResponse } from 'node:http'

  function launchEditorMiddleware(
    specifiedEditor?: string,
    srcRoot?: string,
    onErrorCallback?: (errorMessage: string) => void,
  ): (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void

  export default launchEditorMiddleware
}
