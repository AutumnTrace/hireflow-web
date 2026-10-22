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
import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../../components/ui'
import type { ApplicationStage } from '../../gql/graphql'
import { formatPercent, timeAgo } from '../../lib/format'
import { STAGES, STAGE_LABEL, canMove } from '../../lib/stages'

export interface BoardApplication {
  id: string
  stage: ApplicationStage
  updatedAt: string
  allowedNextStages: ApplicationStage[]
  candidate: { id: string; fullName: string; headline?: string | null }
  skillMatch: { score: number }
}

export interface PipelineBoardProps {
  applications: BoardApplication[]
  /** Called for every drop or menu choice. The board does not validate; the API is the source of truth. */
  onMove: (application: BoardApplication, stage: ApplicationStage) => void
  pendingIds?: ReadonlySet<string>
}

export function PipelineBoard({ applications, onMove, pendingIds }: PipelineBoardProps) {
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
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div className="grid min-w-[66rem] grid-cols-[repeat(4,minmax(10.5rem,1fr))_repeat(3,minmax(8.5rem,0.8fr))] gap-3">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              dragging={active}
              applications={applications.filter((a) => a.stage === stage)}
              onMove={onMove}
              pendingIds={pendingIds}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>{active && <CardBody application={active} lifted />}</DragOverlay>
    </DndContext>
  )
}

function Column({
  stage,
  applications,
  dragging,
  onMove,
  pendingIds,
}: {
  stage: ApplicationStage
  applications: BoardApplication[]
  dragging: BoardApplication | null
  onMove: PipelineBoardProps['onMove']
  pendingIds?: ReadonlySet<string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const isSource = dragging?.stage === stage
  const isAllowed = dragging ? canMove(dragging.allowedNextStages, stage) : false

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STAGE_LABEL[stage]} column, ${applications.length} applicant${applications.length === 1 ? '' : 's'}`}
      data-stage={stage}
      className={clsx(
        'flex min-h-48 flex-col rounded-xl border-2 p-2 transition-colors',
        !dragging && 'border-transparent bg-muted/60',
        dragging && isSource && 'border-transparent bg-muted/60',
        dragging && isAllowed && (isOver ? 'border-accent bg-accent-soft' : 'border-dashed border-accent/60 bg-accent-soft/40'),
        dragging && !isAllowed && !isSource && (isOver ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40' : 'border-transparent bg-muted/30 opacity-60'),
      )}
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold tracking-wide text-ink-2 uppercase">{STAGE_LABEL[stage]}</h3>
        <span className="rounded-full bg-surface px-2 text-xs tabular-nums text-ink-2">{applications.length}</span>
      </header>
      <ul className="flex flex-1 flex-col gap-2">
        {applications.map((application) => (
          <DraggableCard key={application.id} application={application} onMove={onMove} pending={pendingIds?.has(application.id) ?? false} />
        ))}
      </ul>
    </section>
  )
}

function DraggableCard({ application, onMove, pending }: { application: BoardApplication; onMove: PipelineBoardProps['onMove']; pending: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id })

  return (
    <li ref={setNodeRef} className={clsx(isDragging && 'opacity-30')} data-testid={`application-${application.id}`}>
      <div {...listeners} {...attributes} aria-roledescription="draggable application" aria-label={`${application.candidate.fullName}, ${STAGE_LABEL[application.stage]}`} className="cursor-grab rounded-lg focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing">
        <CardBody application={application} pending={pending} />
      </div>
      {application.allowedNextStages.length > 0 && (
        <label className="mt-1 block">
          <span className="sr-only">Move {application.candidate.fullName} to</span>
          <select
            value=""
            disabled={pending}
            onChange={(e) => e.target.value && onMove(application, e.target.value as ApplicationStage)}
            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink-2"
          >
            <option value="">Move to…</option>
            {application.allowedNextStages.map((stage) => (
              <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>
            ))}
          </select>
        </label>
      )}
    </li>
  )
}

function CardBody({ application, lifted, pending }: { application: BoardApplication; lifted?: boolean; pending?: boolean }) {
  const score = application.skillMatch.score
  return (
    <div
      className={clsx(
        'rounded-lg border border-line bg-surface p-2.5 text-left',
        lifted ? 'rotate-2 shadow-xl' : 'shadow-sm',
        pending && 'animate-pulse',
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar name={application.candidate.fullName} size="sm" />
        <Link
          to={`/candidates/${application.candidate.id}`}
          onPointerDown={(e) => e.stopPropagation()}
          className="min-w-0 truncate text-sm font-medium text-ink hover:text-accent hover:underline"
        >
          {application.candidate.fullName}
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 text-xs text-ink-3">
        <span title="Share of required skills this candidate has" className="whitespace-nowrap">
          <span className="font-medium text-ink-2">{formatPercent(score)}</span> match
        </span>
        <span className="whitespace-nowrap">{timeAgo(application.updatedAt)}</span>
      </div>
    </div>
  )
}
