import type { CopilotEndpoint, CopilotResponse, Recording } from './types'

export class CopilotError extends Error {
  readonly retryAfterSeconds?: number

  constructor(message: string, retryAfterSeconds?: number) {
    super(message)
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function endpointUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

/** Calls a running copilot. Its errors come back as `{ detail }` with a status that says what went wrong. */
export async function askCopilot(
  baseUrl: string,
  endpoint: CopilotEndpoint,
  text: string,
  signal?: AbortSignal,
): Promise<CopilotResponse> {
  let response: Response
  try {
    response = await fetch(endpointUrl(baseUrl, `/v1/${endpoint}`), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(endpoint === 'ask' ? { question: text } : { message: text }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new CopilotError(`Could not reach the copilot at ${baseUrl}. Is it running, and does it allow this origin?`)
  }

  if (response.ok) return (await response.json()) as CopilotResponse

  const detail = await response
    .json()
    .then((body: { detail?: unknown }) => (typeof body.detail === 'string' ? body.detail : null))
    .catch(() => null)
  const retryAfter = Number(response.headers.get('retry-after')) || undefined
  if (response.status === 429) {
    throw new CopilotError(detail ?? 'Rate limit reached.', retryAfter)
  }
  throw new CopilotError(detail ?? `The copilot returned HTTP ${response.status}.`)
}

/** Asks the copilot to re-read HireFlow after the UI changed it. Best effort: the index also refreshes on a timer. */
export async function refreshCopilotIndex(baseUrl: string): Promise<void> {
  await fetch(endpointUrl(baseUrl, '/v1/reindex'), { method: 'POST' }).catch(() => undefined)
}

/** Answers recorded from the real copilot against the demo dataset. Loaded on demand, like the demo engine. */
export async function loadRecording(): Promise<Recording> {
  const module = await import('./recorded.json')
  return module.default as Recording
}
