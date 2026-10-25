import clsx from 'clsx'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useMutation } from 'urql'
import { useApi, type AppliedMove } from '../api/ApiProvider'
import { useToast } from '../components/Toaster'
import { Button, Chip } from '../components/ui'
import { MoveApplicationMutation } from '../features/jobs/operations'
import type { ApplicationStage } from '../gql/graphql'
import { STAGE_LABEL } from '../lib/stages'
import { parseAnswer, sourceHref, type Inline } from './answer'
import { CopilotError, askCopilot, loadRecording, refreshCopilotIndex } from './client'
import type { CopilotEndpoint, CopilotProposal, CopilotResponse, CopilotSource, Recording } from './types'

interface Turn {
  id: number
  question: string
  state: 'loading' | 'done' | 'error'
  response?: CopilotResponse
  error?: string
  /** Demo replays only: moves applied before this replay that the recorded answer can't know about. */
  stale?: readonly AppliedMove[]
}

/** Whether a response cites or proposes changes to this application. */
function mentions(response: CopilotResponse, applicationId: string): boolean {
  return (
    response.sources.some((s) => s.source === `hireflow://applications/${applicationId}`) ||
    (response.proposed_actions ?? []).some((p) => p.params.application_id === applicationId)
  )
}

function StaleNotice({ moves }: { moves: readonly AppliedMove[] }) {
  const changes = moves.map((m) => `moved ${m.candidate} to ${STAGE_LABEL[m.stage] ?? m.stage}`)
  return (
    <p role="note" className="border-l-2 border-amber-500 bg-amber-500/10 px-2.5 py-1.5 text-xs text-ink-2">
      Recorded before you {changes.join(' and ')}.
    </p>
  )
}

type ApplyState = 'applying' | 'applied' | { error: string }

/** Questions offered in live mode. The demo offers the recorded ones instead. */
const LIVE_SUGGESTIONS: { endpoint: CopilotEndpoint; question: string }[] = [
  { endpoint: 'agent', question: 'Who are the strongest candidates for the Senior .NET Engineer role, and why?' },
  { endpoint: 'agent', question: 'What interviews are coming up this week?' },
  { endpoint: 'ask', question: 'Why was Nicoleta Turcan rejected?' },
]

function InlineText({ nodes, sources, onCite }: { nodes: Inline[]; sources: CopilotSource[]; onCite: (n: number) => void }) {
  return nodes.map((node, i) => {
    if (node.type === 'text') return node.text
    if (node.type === 'code') return <code key={i} className="rounded-sm bg-muted px-1 text-[0.85em]">{node.text}</code>
    if (node.type === 'bold') {
      return (
        <strong key={i} className="font-semibold text-ink">
          <InlineText nodes={node.children} sources={sources} onCite={onCite} />
        </strong>
      )
    }
    const source = sources.find((s) => s.number === node.number)
    return (
      <button
        key={i}
        type="button"
        onClick={() => onCite(node.number)}
        title={source?.title}
        className="mx-px align-super text-[0.7em] font-semibold text-accent-ink hover:underline"
      >
        [{node.number}]
      </button>
    )
  })
}

function Answer({ response, turnId }: { response: CopilotResponse; turnId: number }) {
  const [highlight, setHighlight] = useState<number | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const cite = (n: number) => {
    setHighlight(n)
    setSourcesOpen(true)
    // Wait a frame so the opened list has laid out before scrolling to the source.
    requestAnimationFrame(() =>
      document.getElementById(`copilot-${turnId}-source-${n}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    )
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed text-ink-2">
      {parseAnswer(response.answer).map((block, i) =>
        block.type === 'paragraph' ? (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <InlineText nodes={line} sources={response.sources} onCite={cite} />
              </span>
            ))}
          </p>
        ) : (
          (() => {
            const List = block.ordered ? 'ol' : 'ul'
            return (
              <List
                key={i}
                start={block.ordered ? block.start : undefined}
                className={clsx('space-y-1.5 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <InlineText nodes={item} sources={response.sources} onCite={cite} />
                  </li>
                ))}
              </List>
            )
          })()
        ),
      )}

      {response.sources.length > 0 && (
        <details
          open={sourcesOpen}
          onToggle={(e) => setSourcesOpen(e.currentTarget.open)}
          className="border-t border-line pt-2"
        >
          <summary className="cursor-pointer text-xs font-medium text-ink-3 hover:text-ink">
            {response.sources.length} {response.sources.length === 1 ? 'source' : 'sources'}
          </summary>
          <ol aria-label="Sources" className="mt-2 space-y-1.5">
            {response.sources.map((source) => {
              const href = sourceHref(source)
              return (
                <li
                  key={source.number}
                  id={`copilot-${turnId}-source-${source.number}`}
                  className={clsx('rounded-sm p-1.5 text-xs transition-colors', highlight === source.number && 'bg-accent-soft')}
                >
                  <span className="font-semibold text-ink">[{source.number}] </span>
                  {href ? (
                    <Link to={href} className="font-medium text-ink underline decoration-line underline-offset-2 hover:decoration-ink">
                      {source.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink">{source.title}</span>
                  )}
                  {source.quotes.map((quote) => (
                    <q key={quote} className="mt-0.5 block text-ink-3">{quote}</q>
                  ))}
                </li>
              )
            })}
          </ol>
        </details>
      )}
    </div>
  )
}

function Proposal({
  proposal,
  state,
  onApply,
}: {
  proposal: CopilotProposal
  state: ApplyState | undefined
  onApply: () => void
}) {
  const canApply = proposal.kind === 'move_application'
  return (
    <div className="corner-marks border border-accent/40 bg-accent-soft/40 p-3">
      <p className="label-caps text-[0.7rem] text-accent-ink">Proposed change · needs your approval</p>
      <p className="mt-1 text-sm text-ink">{proposal.summary}</p>
      <div className="mt-2 flex items-center gap-2">
        {state === 'applied' ? (
          <span className="text-sm font-medium text-accent-ink">✓ Applied</span>
        ) : (
          <Button variant="primary" onClick={onApply} disabled={!canApply || state === 'applying'}>
            {state === 'applying' ? 'Applying…' : 'Apply'}
          </Button>
        )}
        {!canApply && <span className="text-xs text-ink-3">Scheduling from the panel isn't supported yet.</span>}
      </div>
      {typeof state === 'object' && <p role="alert" className="mt-2 text-xs text-rose-600">{state.error}</p>}
    </div>
  )
}

function Meta({ response, recorded }: { response: CopilotResponse; recorded: boolean }) {
  const tools = response.tool_calls ?? []
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
      {tools.map((call, i) => (
        <Chip key={i} className={clsx(call.is_error && 'line-through')}>{call.name}</Chip>
      ))}
      <span>
        {tools.length > 0 ? `${response.steps ?? '?'} model calls · ` : ''}${response.usage.cost_usd.toFixed(3)}
        {recorded && ' when recorded'}
      </span>
    </div>
  )
}

export function CopilotPanel({ onClose }: { onClose: () => void }) {
  const { settings, appliedMoves, recordMove } = useApi()
  const toast = useToast()
  const [, moveApplication] = useMutation(MoveApplicationMutation)
  const demo = settings.mode === 'demo'

  const [recording, setRecording] = useState<Recording | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [applied, setApplied] = useState<Record<string, ApplyState>>({})
  const nextId = useRef(1)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (demo) loadRecording().then(setRecording, () => setRecording(null))
  }, [demo])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      abort.current?.abort()
    }
  }, [onClose])

  // Bring each new question to the top of the panel, so its answer reads from the start.
  const latestTurn = turns.at(-1)?.id
  useEffect(() => {
    if (latestTurn) document.getElementById(`copilot-turn-${latestTurn}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [latestTurn])

  const busy = turns.some((t) => t.state === 'loading')

  const ask = async (question: string, endpoint: CopilotEndpoint) => {
    const id = nextId.current++
    setTurns((all) => [...all, { id, question, state: 'loading' }])
    const finish = (patch: Partial<Turn>) => setTurns((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)))

    if (demo) {
      const item = recording?.items.find((i) => i.question === question)
      // Decided now, not at render: a later Apply shouldn't flag the answer that proposed it.
      const stale = item ? appliedMoves.filter((m) => mentions(item.response, m.applicationId)) : []
      finish(item ? { state: 'done', response: item.response, stale } : { state: 'error', error: 'No recording for that question.' })
      return
    }

    abort.current?.abort()
    abort.current = new AbortController()
    try {
      finish({ state: 'done', response: await askCopilot(settings.copilotUrl, endpoint, question, abort.current.signal) })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message =
        error instanceof CopilotError && error.retryAfterSeconds
          ? `${error.message} Try again in ${error.retryAfterSeconds}s.`
          : error instanceof Error
            ? error.message
            : String(error)
      finish({ state: 'error', error: message })
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const question = text.trim()
    if (!question || busy) return
    setText('')
    void ask(question, 'agent')
  }

  const apply = async (proposal: CopilotProposal) => {
    if (proposal.kind !== 'move_application') return
    setApplied((s) => ({ ...s, [proposal.id]: 'applying' }))
    const { application_id, stage, note } = proposal.params
    const result = await moveApplication({ applicationId: application_id, stage: stage as ApplicationStage, note })
    const domainError = result.data?.moveApplication.errors?.[0]
    if (result.error || domainError) {
      const message = domainError && 'message' in domainError ? domainError.message : (result.error?.message ?? 'Failed')
      setApplied((s) => ({ ...s, [proposal.id]: { error: message } }))
      return
    }
    setApplied((s) => ({ ...s, [proposal.id]: 'applied' }))
    const candidate = result.data?.moveApplication.jobApplication?.candidate.fullName
    if (candidate) recordMove({ applicationId: application_id, candidate, stage: stage as ApplicationStage })
    toast({ tone: 'success', title: `Moved to ${STAGE_LABEL[stage as ApplicationStage] ?? stage}`, description: proposal.summary })
    if (!demo) void refreshCopilotIndex(settings.copilotUrl)
  }

  const suggestions = demo
    ? (recording?.items ?? []).map((i) => ({ endpoint: i.endpoint, question: i.question }))
    : LIVE_SUGGESTIONS

  let header: ReactNode
  if (demo) {
    header = recording ? (
      <>
        Recorded answers from {recording.model} on {new Date(recording.recordedAt).toLocaleDateString()}, against this demo
        data. <span className="text-mast-ink">Apply</span> changes the board for real.
      </>
    ) : (
      'Loading recorded answers…'
    )
  } else {
    header = <>Live: {settings.copilotUrl}</>
  }

  return (
    <aside
      aria-label="Copilot"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md animate-rise flex-col border-l border-line bg-surface shadow-[-12px_0_32px_-16px_rgba(29,42,58,0.45)]"
    >
      <div className="bg-mast px-4 py-3 text-mast-ink">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-wide uppercase">✦ Copilot</h2>
          <Button variant="mast" onClick={onClose} aria-label="Close copilot" className="px-2.5">
            ✕
          </Button>
        </div>
        <p className="mt-1 text-xs text-mast-muted">{header}</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {turns.length === 0 && (
          <p className="text-sm text-ink-2">
            Ask about candidates, pipelines and interviews. Answers cite the HireFlow records they come from, and any change
            the copilot proposes waits for you to apply it.
          </p>
        )}

        {turns.map((turn) => (
          <section key={turn.id} id={`copilot-turn-${turn.id}`} aria-label={turn.question} className="scroll-mt-4 space-y-2">
            <p className="ml-8 rounded-sm bg-muted px-3 py-2 text-sm text-ink">{turn.question}</p>
            {turn.state === 'loading' && (
              <p className="animate-pulse text-sm text-ink-3" aria-busy="true">
                Thinking: searching HireFlow…
              </p>
            )}
            {turn.state === 'error' && (
              <p role="alert" className="text-sm text-rose-600">{turn.error}</p>
            )}
            {turn.response && (
              <>
                {turn.stale && turn.stale.length > 0 && <StaleNotice moves={turn.stale} />}
                <Answer response={turn.response} turnId={turn.id} />
                {(turn.response.proposed_actions ?? []).map((p) => (
                  <Proposal key={p.id} proposal={p} state={applied[p.id]} onApply={() => void apply(p)} />
                ))}
                <Meta response={turn.response} recorded={demo} />
              </>
            )}
          </section>
        ))}
      </div>

      <div className="space-y-3 border-t border-line p-4">
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.question}
              type="button"
              disabled={busy}
              onClick={() => void ask(s.question, s.endpoint)}
              className="rounded-sm border border-line px-2 py-1 text-left text-xs text-ink-2 hover:border-accent hover:text-ink disabled:opacity-50"
            >
              {s.question}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={demo}
            aria-label="Ask the copilot"
            placeholder={demo ? 'Demo: pick a question above. Live mode takes any question.' : 'Ask anything about the pipeline…'}
            className="min-w-0 flex-1 rounded-sm border border-line bg-canvas px-3 py-2 text-sm focus:outline-2 focus:outline-accent disabled:opacity-60"
          />
          <Button type="submit" variant="primary" disabled={demo || busy || !text.trim()}>
            Ask
          </Button>
        </form>
      </div>
    </aside>
  )
}
