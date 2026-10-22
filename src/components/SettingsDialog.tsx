import clsx from 'clsx'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useApi } from '../api/ApiProvider'
import type { ApiMode } from '../api/settings'
import { Button } from './ui'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useApi()
  const [mode, setMode] = useState<ApiMode>(settings.mode)
  const [apiUrl, setApiUrl] = useState(settings.apiUrl)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateSettings({ mode, apiUrl: apiUrl.trim() })
    onClose()
  }

  const option = (value: ApiMode, title: string, description: string) => (
    <div
      className={clsx(
        'flex gap-3 rounded-lg border p-3',
        mode === value ? 'border-accent bg-accent-soft' : 'border-line hover:bg-muted',
      )}
    >
      <input
        id={`mode-${value}`}
        type="radio"
        name="mode"
        value={value}
        checked={mode === value}
        onChange={() => setMode(value)}
        aria-describedby={`mode-${value}-description`}
        className="mt-1 accent-accent"
      />
      <div>
        <label htmlFor={`mode-${value}`} className="block cursor-pointer text-sm font-medium text-ink">{title}</label>
        <p id={`mode-${value}-description`} className="text-sm text-ink-2">{description}</p>
      </div>
    </div>
  )

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="settings-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        <h2 id="settings-title" className="text-lg font-semibold">Data source</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Mode</legend>
          {option('demo', 'Demo data', 'Runs the HireFlow schema in your browser with sample data. Nothing to install.')}
          {option('live', 'Live API', 'Connects to a running HireFlow API and signs in as a demo recruiter.')}
        </fieldset>

        {mode === 'live' && (
          <label className="block">
            <span className="text-sm font-medium">API URL</span>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="Leave empty to use the Vite dev proxy"
              className="mt-1 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm focus:outline-2 focus:outline-accent"
            />
            <span className="mt-1 block text-xs text-ink-3">
              e.g. <code>http://localhost:5230</code>. The API must list this site in <code>Cors:AllowedOrigins</code>.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </dialog>
  )
}
