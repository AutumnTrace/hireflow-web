export type ApiMode = 'demo' | 'live'

export interface ApiSettings {
  mode: ApiMode
  /** Base URL of a HireFlow API, e.g. https://api.example.com. Empty means same origin (Vite dev proxy). */
  apiUrl: string
}

const STORAGE_KEY = 'hireflow.settings'

export const DEFAULT_SETTINGS: ApiSettings = {
  mode: import.meta.env.VITE_DEFAULT_MODE === 'live' ? 'live' : 'demo',
  apiUrl: import.meta.env.VITE_API_URL ?? '',
}

export function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ApiSettings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (private mode); settings then last for the session only.
  }
}

export function graphqlHttpUrl(apiUrl: string): string {
  return `${apiUrl.replace(/\/+$/, '')}/graphql`
}

export function graphqlWsUrl(apiUrl: string, location: Pick<Location, 'protocol' | 'host'> = window.location): string {
  const base = apiUrl ? new URL(apiUrl) : new URL(`${location.protocol}//${location.host}`)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = `${base.pathname.replace(/\/+$/, '')}/graphql`
  return base.toString()
}
