import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useApi } from '../api/ApiProvider'
import { Button, Card, Skeleton } from './ui'
import { SettingsDialog } from './SettingsDialog'

const NAV = [
  { to: '/jobs', label: 'Jobs', icon: '💼' },
  { to: '/candidates', label: 'Candidates', icon: '👥' },
  { to: '/interviews', label: 'Interviews', icon: '🗓️' },
]

type Theme = 'system' | 'light' | 'dark'

function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('hireflow.theme') as Theme | null) ?? 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('hireflow.theme', theme)
    } catch {
      // ignore unavailable storage
    }
  }, [theme])

  return [theme, setTheme]
}

export function Layout() {
  const { settings, connection, reset } = useApi()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useTheme()
  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 p-4 md:block">
          <NavLink to="/jobs" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-7" />
            HireFlow
          </NavLink>
          <nav aria-label="Main" className="flex gap-1 md:mt-6 md:flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-accent-soft text-accent-ink' : 'text-ink-2 hover:bg-muted hover:text-ink',
                  )
                }
              >
                <span aria-hidden>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden p-4 md:absolute md:bottom-0 md:block md:w-full">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="w-full rounded-lg border border-line p-3 text-left text-xs hover:bg-muted"
          >
            <span className="flex items-center gap-2 font-medium text-ink">
              <span className={clsx('size-2 rounded-full', connection.status === 'ready' ? 'bg-emerald-500' : connection.status === 'error' ? 'bg-rose-500' : 'bg-amber-400')} aria-hidden />
              {settings.mode === 'demo' ? 'Demo data' : 'Live API'}
            </span>
            <span className="mt-1 block text-ink-3">{settings.mode === 'demo' ? 'Runs in your browser' : settings.apiUrl || 'via dev proxy'}</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-end gap-2 border-b border-line bg-surface/80 px-4 py-2 backdrop-blur md:px-8">
          {settings.mode === 'demo' && (
            <span className="mr-auto hidden text-xs text-ink-3 sm:block">
              Demo mode: data lives in your browser. Drag cards around freely.
            </span>
          )}
          {settings.mode === 'demo' && (
            <Button variant="ghost" onClick={reset} title="Discard all demo changes">
              ↺ Reset demo
            </Button>
          )}
          <Button variant="ghost" onClick={() => setTheme(nextTheme[theme])} aria-label={`Theme: ${theme}. Switch theme`}>
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🖥️'}
          </Button>
          <Button onClick={() => setSettingsOpen(true)}>
            {settings.mode === 'demo' ? 'Demo data' : 'Live API'} ⚙
          </Button>
        </div>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {connection.status === 'ready' && <Outlet />}
          {connection.status === 'connecting' && (
            <div className="space-y-4" aria-busy="true" aria-label="Connecting to the API">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-40" />
            </div>
          )}
          {connection.status === 'error' && (
            <Card className="max-w-xl p-6" role="alert">
              <p className="font-medium text-ink">Can't connect to the HireFlow API</p>
              <p className="mt-2 text-sm text-ink-2">{connection.message}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={reset}>Retry</Button>
                <Button variant="primary" onClick={() => setSettingsOpen(true)}>Change connection</Button>
              </div>
            </Card>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
