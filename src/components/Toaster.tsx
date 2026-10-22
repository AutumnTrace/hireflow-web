import clsx from 'clsx'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error' | 'info'
interface Toast {
  id: number
  tone: Tone
  title: string
  description?: string
}

const ToastContext = createContext<((toast: Omit<Toast, 'id'>) => void) | null>(null)

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current.slice(-3), { ...toast, id }])
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), toast.tone === 'error' ? 6000 : 3500)
  }, [])

  const value = useMemo(() => push, [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'pointer-events-auto w-full animate-rise border-l-4 bg-raised p-3 shadow-[0_12px_28px_-12px_rgba(29,42,58,0.45)]',
              t.tone === 'error' ? 'border-rose-500' : 'border-accent',
            )}
          >
            <p className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <span aria-hidden className={clsx('size-2', t.tone === 'error' ? 'bg-rose-500' : 'bg-accent')} />
              {t.title}
            </p>
            {t.description && <p className="mt-1 text-sm text-ink-2">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <Toaster>')
  return context
}
