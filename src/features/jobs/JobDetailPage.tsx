import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery } from 'urql'
import { useToast } from '../../components/Toaster'
import { Badge, Card, ErrorState, PageHeader, SkillTag, Skeleton } from '../../components/ui'
import type { ApplicationStage } from '../../gql/graphql'
import { EMPLOYMENT_LABEL, WORK_MODE_LABEL, formatPercent, formatSalary } from '../../lib/format'
import { ACTIVE_STAGES, STAGE_LABEL, canMove } from '../../lib/stages'
import { ActivityFeed } from './ActivityFeed'
import { PipelineBoard, type BoardApplication } from './PipelineBoard'
import { PipelineChart } from './PipelineChart'
import { JobDetailQuery, MoveApplicationMutation } from './operations'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

export function JobDetailPage() {
  const { jobId = '' } = useParams()
  const toast = useToast()
  const [{ data, fetching, error }, refetch] = useQuery({ query: JobDetailQuery, variables: { id: jobId } })
  const [, moveApplication] = useMutation(MoveApplicationMutation)

  // Optimistic stage per application while a move is in flight.
  const [optimistic, setOptimistic] = useState<Record<string, ApplicationStage>>({})

  const job = data?.job
  const applications = useMemo<BoardApplication[]>(
    () => (job?.applications ?? []).map((a) => (optimistic[a.id] ? { ...a, stage: optimistic[a.id]!, allowedNextStages: [] } : a)),
    [job, optimistic],
  )
  const pendingIds = useMemo(() => new Set(Object.keys(optimistic)), [optimistic])

  const handleMove = async (application: BoardApplication, stage: ApplicationStage) => {
    const valid = canMove(application.allowedNextStages, stage)
    if (valid) setOptimistic((o) => ({ ...o, [application.id]: stage }))

    const result = await moveApplication({ applicationId: application.id, stage })
    setOptimistic((o) => Object.fromEntries(Object.entries(o).filter(([id]) => id !== application.id)))

    const payload = result.data?.moveApplication
    const domainError = payload?.errors?.[0]
    if (result.error || domainError) {
      toast({
        tone: 'error',
        title: `Can't move ${application.candidate.fullName}`,
        description: domainError && 'message' in domainError ? domainError.message : result.error?.message,
      })
      return
    }

    toast({ tone: 'success', title: `${application.candidate.fullName} → ${STAGE_LABEL[stage]}` })
    refetch({ requestPolicy: 'network-only' })
  }

  const handleRemoteEvent = useCallback(() => refetch({ requestPolicy: 'network-only' }), [refetch])

  if (error) return <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  if (fetching && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    )
  }
  if (!job) return <ErrorState message="This job posting does not exist." />

  const active = job.applications.filter((a) => ACTIVE_STAGES.includes(a.stage)).length
  const avgMatch = job.applications.length
    ? job.applications.reduce((sum, a) => sum + a.skillMatch.score, 0) / job.applications.length
    : 0

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-3">
        <Link to="/jobs" className="hover:text-accent">Jobs</Link> <span aria-hidden>/</span> {job.company.name}
      </nav>
      <PageHeader
        title={job.title}
        subtitle={[job.company.name, WORK_MODE_LABEL[job.workMode], EMPLOYMENT_LABEL[job.employmentType], job.location, formatSalary(job.salary)].filter(Boolean).join(' · ')}
        actions={job.status !== 'OPEN' && <Badge>{job.status === 'DRAFT' ? 'Draft' : 'Closed'}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Card className="p-5">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Applicants" value={job.pipeline.total} />
            <Stat label="In progress" value={active} />
            <Stat label="Hire rate" value={formatPercent(job.pipeline.hireRate)} />
          </div>
          <p className="mt-5 text-xs text-ink-3">Required skills · avg. match {formatPercent(avgMatch)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.requiredSkills.map((skill) => <SkillTag key={skill} skill={skill} />)}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-2">{job.description}</p>
        </Card>

        <Card className="p-5">
          <PipelineChart byStage={job.pipeline.byStage} total={job.pipeline.total} />
        </Card>

        <Card className="max-h-80 overflow-y-auto p-5">
          <ActivityFeed jobPostingId={job.id} onEvent={handleRemoteEvent} />
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="board-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="board-title" className="text-lg font-semibold text-ink">Pipeline</h2>
          <p className="text-sm text-ink-3">Drag a card to a highlighted column, or use its “Move to…” menu.</p>
        </div>
        <PipelineBoard applications={applications} onMove={handleMove} pendingIds={pendingIds} />
      </section>
    </>
  )
}
