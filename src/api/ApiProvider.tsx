import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Provider as UrqlProvider, type Client } from 'urql'
import type { ApplicationStage } from '../gql/graphql'
import { fetchDevToken } from './auth'
import { createLiveClient } from './client'
import { loadSettings, saveSettings, type ApiSettings } from './settings'

export type Connection =
  | { status: 'connecting' }
  | { status: 'ready'; client: Client }
  | { status: 'error'; message: string }

/** A copilot proposal the user applied, remembered so recorded answers can say they predate it. */
export interface AppliedMove {
  applicationId: string
  candidate: string
  stage: ApplicationStage
}

interface ApiContextValue {
  settings: ApiSettings
  connection: Connection
  updateSettings: (settings: ApiSettings) => void
  /** Discards all demo changes (or reconnects in live mode). */
  reset: () => void
  /** Moves applied from the copilot against the current data. Cleared whenever the data is reloaded. */
  appliedMoves: readonly AppliedMove[]
  recordMove: (move: AppliedMove) => void
}

const NO_MOVES: readonly AppliedMove[] = []

const ApiContext = createContext<ApiContextValue | null>(null)

function describe(error: unknown, apiUrl: string): string {
  if (error instanceof TypeError) {
    return `Could not reach the API at ${apiUrl || window.location.origin}. Is it running, and does it allow this origin (Cors:AllowedOrigins)?`
  }
  return error instanceof Error ? error.message : String(error)
}

async function connect(settings: ApiSettings): Promise<{ client: Client; dispose?: () => void }> {
  if (settings.mode === 'demo') {
    // The in-browser GraphQL engine is only downloaded when demo mode is used.
    const { createDemoClient } = await import('../demo/client')
    return { client: createDemoClient() }
  }
  const token = await fetchDevToken(settings.apiUrl)
  return createLiveClient(settings.apiUrl, token)
}

export function ApiProvider({ children, initialSettings }: { children: ReactNode; initialSettings?: ApiSettings }) {
  const [settings, setSettings] = useState<ApiSettings>(() => initialSettings ?? loadSettings())
  const [generation, setGeneration] = useState(0)

  // Each connection result is tagged with the attempt it belongs to, so a slow response from an
  // earlier attempt never overwrites a newer one, and no state is set synchronously in the effect.
  const attempt = `${settings.mode}|${settings.apiUrl}|${generation}`
  const [result, setResult] = useState<{ attempt: string; connection: Connection } | null>(null)

  useEffect(() => {
    let cancelled = false
    let dispose: (() => void) | undefined

    connect(settings)
      .then((connected) => {
        dispose = connected.dispose
        if (cancelled) dispose?.()
        else setResult({ attempt, connection: { status: 'ready', client: connected.client } })
      })
      .catch((error: unknown) => {
        if (!cancelled) setResult({ attempt, connection: { status: 'error', message: describe(error, settings.apiUrl) } })
      })

    return () => {
      cancelled = true
      dispose?.()
    }
  }, [settings, attempt])

  const connection = useMemo<Connection>(
    () => (result?.attempt === attempt ? result.connection : { status: 'connecting' }),
    [result, attempt],
  )

  const updateSettings = useCallback((next: ApiSettings) => {
    saveSettings(next)
    setSettings(next)
  }, [])

  const reset = useCallback(() => setGeneration((g) => g + 1), [])

  // Tagged with the attempt like the connection, so a reset or a backend switch forgets them.
  const [moves, setMoves] = useState<{ attempt: string; list: readonly AppliedMove[] }>({ attempt, list: NO_MOVES })
  const appliedMoves = moves.attempt === attempt ? moves.list : NO_MOVES
  const recordMove = useCallback(
    (move: AppliedMove) =>
      setMoves((current) => {
        const kept = current.attempt === attempt ? current.list.filter((m) => m.applicationId !== move.applicationId) : []
        return { attempt, list: [...kept, move] }
      }),
    [attempt],
  )

  const value = useMemo(
    () => ({ settings, connection, updateSettings, reset, appliedMoves, recordMove }),
    [settings, connection, updateSettings, reset, appliedMoves, recordMove],
  )

  return (
    <ApiContext.Provider value={value}>
      {connection.status === 'ready' ? <UrqlProvider value={connection.client}>{children}</UrqlProvider> : children}
    </ApiContext.Provider>
  )
}

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext)
  if (!context) throw new Error('useApi must be used inside <ApiProvider>')
  return context
}
