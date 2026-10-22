import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Chip } from '../../components/ui'
import type { ApplicationStage, InterviewKind } from '../../gql/graphql'
import { formatPercent } from '../../lib/format'
import { rise } from '../../lib/motion'
import { EXIT_STAGES, STAGES, STAGE_LABEL, canMove } from '../../lib/stages'
import { daysInStage } from './pipeline'

export interface BoardApplication {
  id: string
  stage: ApplicationStage
  updatedAt: string
  allowedNextStages: ApplicationStage[]
  candidate: { id: string; fullName: string; headline?: string | null }
  skillMatch: { score: number; matchedSkills?: string[] }
  interviews?: { kind: InterviewKind; scheduledAt: string }[]
}

export interface PipelineBoardProps {
  applications: BoardApplication[]
  /** Called for every drop or menu choice. The board does not validate; the API is the source of truth. */
  onMove: (application: BoardApplication, stage: ApplicationStage) => void
  pendingIds?: ReadonlySet<string>
  /** Active applications untouched for longer than this are flagged as stalled. */
  staleDays?: number
  now?: Date
}

const INTERVIEW_SHORT: Record<InterviewKind, string> = {
  PHONE_SCREEN: 'Call',
  TECHNICAL: 'Tech round',
  SYSTEM_DESIGN: 'Design round',
  BEHAVIORAL: 'Culture fit',
  ONSITE: 'Onsite',
}

function nextInterview(application: BoardApplication, now: Date) {
  return application.interviews
    ?.filter((i) => new Date(i.scheduledAt) > now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
}

export function PipelineBoard({ applications, onMove, pendingIds, staleDays = 7, now: nowProp }: PipelineBoardProps) {
  // Captured once per mount so "days in stage" is stable across re-renders.
  const [now] = useState(() => nowProp ?? new Date())
  const [active, setActive] = useState<BoardApplication | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const handleStart = (event: DragStartEvent) =>
    setActive(applications.find((a) => a.id === event.active.id) ?? null)

  const handleEnd = (event: DragEndEvent) => {
    const application = active
    setActive(null)
    const target = event.over?.id as ApplicationStage | undefined
    if (application && target && target !== application.stage) {
      onMove(application, target)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd} onDragCancel={() => setActive(null)}>
      <div className="-mx-4 overflow-x-auto px-4 pt-1 pb-3 md:mx-0 md:px-0">
        <div className="grid min-w-[72rem] grid-cols-[repeat(5,minmax(10.5rem,1fr))_repeat(2,minmax(7.25rem,0.7fr))] gap-x-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              dragging={active}
              applications={applications.filter((a) => a.stage === stage)}
              onMove={onMove}
              pendingIds={pendingIds}
              staleDays={staleDays}
              now={now}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {active && <CardBody application={active} lifted staleDays={staleDays} now={now} />}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  stage,
  applications,
  dragging,
  onMove,
  pendingIds,
  staleDays,
  now,
}: {
  stage: ApplicationStage
  applications: BoardApplication[]
  dragging: BoardApplication | null
  onMove: PipelineBoardProps['onMove']
  pendingIds?: ReadonlySet<string>
  staleDays: number
  now: Date
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const isSource = dragging?.stage === stage
  const isAllowed = dragging ? canMove(dragging.allowedNextStages, stage) : false
  const isExit = EXIT_STAGES.includes(stage)

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STAGE_LABEL[stage]} column, ${applications.length} applicant${applications.length === 1 ? '' : 's'}`}
      data-stage={stage}
      className={clsx(
        'flex min-h-56 flex-col outline-offset-4 transition-[background-color,outline-color,opacity] duration-150',
        dragging && isAllowed && (isOver ? 'bg-accent-soft outline-2 outline-accent' : 'bg-accent-soft/50 outline-1 outline-dashed outline-accent/70'),
        dragging && !isAllowed && !isSource && (isOver ? 'bg-rose-500/10 outline-2 outline-rose-400' : 'opacity-45'),
      )}
    >
      <header className={clsx('mb-4 flex items-baseline gap-2 border-b pb-2', isExit ? 'border-line' : 'border-rule')}>
        <h3 className={clsx('label-caps', isExit ? 'text-ink-3' : 'text-ink')}>{STAGE_LABEL[stage]}</h3>
        <span className="font-display text-sm text-ink-3 tabular-nums">{applications.length}</span>
      </header>
      <ul className="flex flex-1 flex-col gap-3">
        {applications.map((application, i) => (
          <DraggableCard
            key={application.id}
            index={i}
            application={application}
            onMove={onMove}
            pending={pendingIds?.has(application.id) ?? false}
            staleDays={staleDays}
            now={now}
          />
        ))}
      </ul>
    </section>
  )
}

function DraggableCard({
  application,
  onMove,
  pending,
  index,
  staleDays,
  now,
}: {
  application: BoardApplication
  onMove: PipelineBoardProps['onMove']
  pending: boolean
  index: number
  staleDays: number
  now: Date
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id })
  const entrance = rise(index)

  return (
    <li ref={setNodeRef} className={clsx(entrance.className, isDragging && 'opacity-30')} style={entrance.style} data-testid={`application-${application.id}`}>
      <div
        {...listeners}
        {...attributes}
        aria-roledescription="draggable application"
        aria-label={`${application.candidate.fullName}, ${STAGE_LABEL[application.stage]}`}
        className="cursor-grab focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:cursor-grabbing"
      >
        <CardBody application={application} pending={pending} staleDays={staleDays} now={now}>
          {application.allowedNextStages.length > 0 && (
            <label>
              <span className="sr-only">Move {application.candidate.fullName} to</span>
              <select
                value=""
                disabled={pending}
                onChange={(e) => e.target.value && onMove(application, e.target.value as ApplicationStage)}
                // Keep pointer/keyboard input on the menu from starting a drag of the card.
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="label-caps cursor-pointer appearance-none rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-[0.7rem] text-ink-3 hover:border-line hover:text-ink focus:border-accent"
              >
                <option value="">Move ▾</option>
                {application.allowedNextStages.map((stage) => (
                  <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>
                ))}
              </select>
            </label>
          )}
        </CardBody>
      </div>
    </li>
  )
}

function CardBody({
  application,
  lifted,
  pending,
  staleDays,
  now,
  children,
}: {
  application: BoardApplication
  lifted?: boolean
  pending?: boolean
  staleDays: number
  now: Date
  children?: ReactNode
}) {
  const score = application.skillMatch.score
  const filled = Math.round(score * 5)
  const days = daysInStage(application.updatedAt, now)
  const isActive = application.allowedNextStages.length > 0 || pending
  const stalled = isActive && application.stage !== 'HIRED' && days > staleDays
  const interview = nextInterview(application, now)
  const skills = (application.skillMatch.matchedSkills ?? []).slice(0, interview ? 1 : 2)

  return (
    <div
      className={clsx(
        'corner-marks border bg-surface p-3.5 text-left transition-[transform,box-shadow,border-color,background-color] duration-200',
        lifted
          ? 'rotate-1 border-accent bg-raised shadow-[0_18px_40px_-16px_rgba(29,42,58,0.55)]'
          : 'border-line hover:-translate-y-0.5 hover:border-accent hover:bg-raised hover:shadow-[0_10px_24px_-14px_rgba(29,42,58,0.45)]',
        pending && 'animate-pulse',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/candidates/${application.candidate.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="min-w-0 truncate font-display text-xl leading-tight font-semibold text-ink hover:text-accent"
        >
          {application.candidate.fullName}
        </Link>
        <span className="font-display text-xl leading-tight font-semibold text-accent tabular-nums" title="Share of the job's required skills this candidate has">
          {formatPercent(score)}
        </span>
      </div>
      {application.candidate.headline && <p className="truncate text-xs text-ink-3">{application.candidate.headline}</p>}

      <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={clsx('h-[3px]', i < filled ? 'bg-accent' : 'bg-line')} />
        ))}
      </div>
      <span className="sr-only">{formatPercent(score)} skill match</span>

      {(interview || skills.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((s) => <Chip key={s}>{s}</Chip>)}
          {interview && (
            <Chip tone="accent">
              {INTERVIEW_SHORT[interview.kind]}{' '}
              {new Intl.DateTimeFormat('en', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(interview.scheduledAt))}
            </Chip>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          title={`${days} day${days === 1 ? '' : 's'} in this stage`}
          className={clsx('label-caps flex min-w-0 items-center gap-1.5 text-[0.7rem] whitespace-nowrap', stalled ? 'text-accent-ink' : 'text-ink-3')}
        >
          <span aria-hidden className={clsx('size-1.5', stalled ? 'bg-accent' : 'bg-mark')} />
          {application.stage === 'HIRED'
            ? 'Hired'
            : EXIT_STAGES.includes(application.stage)
              ? STAGE_LABEL[application.stage]
              : `${days} day${days === 1 ? '' : 's'}${stalled ? ' · stalled' : ''}`}
        </span>
        {children}
      </div>
    </div>
  )
}
