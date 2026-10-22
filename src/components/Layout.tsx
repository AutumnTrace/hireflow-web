import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useApi } from '../api/ApiProvider'
import { Button, Card, PageBody, Skeleton } from './ui'
import { SettingsDialog } from './SettingsDialog'

const NAV = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/interviews', label: 'Interviews' },
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

function Wordmark() {
  return (
    <NavLink to="/jobs" className="flex items-center gap-2.5 text-mast-ink">
      <svg aria-hidden viewBox="0 0 20 14" className="h-3.5 w-5 text-mast-muted" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M1 1h18M1 7h13M1 13h8" strokeLinecap="square" />
      </svg>
      <span className="font-display text-lg font-bold tracking-[0.18em]">HIREFLOW</span>
    </NavLink>
  )
}

export function Layout() {
  const { settings, connection, reset } = useApi()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useTheme()
  const nextTheme: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

  return (
    <div className="min-h-screen">
      <div className="bg-mast text-mast-ink">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 border-b border-mast-line px-4 py-3 md:px-8">
          <Wordmark />

          <nav aria-label="Main" className="order-3 -mx-1 flex w-full gap-5 overflow-x-auto px-1 sm:order-none sm:w-auto">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'border-b-2 py-1.5 text-[0.95rem] font-medium whitespace-nowrap transition-colors',
                    isActive ? 'border-mast-ink text-mast-ink' : 'border-transparent text-mast-muted hover:text-mast-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {settings.mode === 'demo' && (
              <Button variant="mast" className="hidden sm:inline-flex" onClick={reset} title="Discard all demo changes">
                Reset demo
              </Button>
            )}
            <Button
              variant="mast"
              onClick={() => setTheme(nextTheme[theme])}
              aria-label={`Theme: ${theme}. Switch theme`}
              className="px-2.5"
            >
              <span aria-hidden>{theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'}</span>
            </Button>
            <Button variant="mast" onClick={() => setSettingsOpen(true)}>
              <span
                aria-hidden
                className={clsx(
                  'size-1.5 rounded-full',
                  connection.status === 'ready' ? 'bg-emerald-400' : connection.status === 'error' ? 'bg-rose-400' : 'bg-amber-300',
                )}
              />
              {settings.mode === 'demo' ? 'Demo data' : 'Live API'} ⚙
            </Button>
          </div>
        </div>
      </div>

      <main>
        {connection.status === 'ready' && <Outlet />}
        {connection.status === 'connecting' && (
          <>
            <div className="h-48 bg-mast" />
            <PageBody>
              <div className="space-y-4" aria-busy="true" aria-label="Connecting to the API">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40" />
              </div>
            </PageBody>
          </>
        )}
        {connection.status === 'error' && (
          <PageBody>
            <Card marks className="max-w-xl p-6" role="alert">
              <p className="font-display text-lg font-semibold text-ink uppercase">Can't connect to the HireFlow API</p>
              <p className="mt-2 text-sm text-ink-2">{connection.message}</p>
              <div className="mt-4 flex gap-2">
                <Button onClick={reset}>Retry</Button>
                <Button variant="primary" onClick={() => setSettingsOpen(true)}>Change connection</Button>
              </div>
            </Card>
          </PageBody>
        )}
      </main>

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
