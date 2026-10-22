import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useMutation, useQuery } from 'urql'
import { useToast } from '../../components/Toaster'
import { Badge, Card, ErrorState, PageBody, PageHeader, SectionTitle, SkillTag, Skeleton } from '../../components/ui'
import type { ApplicationStage } from '../../gql/graphql'
import { EMPLOYMENT_LABEL, WORK_MODE_LABEL, formatPercent, formatSalary, timeAgo } from '../../lib/format'
import { ACTIVE_STAGES, STAGE_LABEL, canMove } from '../../lib/stages'
import { ActivityFeed } from './ActivityFeed'
import { PipelineBoard, type BoardApplication } from './PipelineBoard'
import { StageStrip } from './StageStrip'
import { JobDetailQuery, MoveApplicationMutation } from './operations'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="label-caps text-ink-3">{label}</dt>
      <dd className="mt-1 font-display text-3xl leading-none font-semibold text-ink tabular-nums">{value}</dd>
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

  if (error) {
    return (
      <PageBody>
        <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />
      </PageBody>
    )
  }
  if (fetching && !data) {
    return (
      <>
        <div className="h-72 bg-mast" />
        <PageBody>
          <Skeleton className="h-72" />
        </PageBody>
      </>
    )
  }
  if (!job) {
    return (
      <PageBody>
        <ErrorState message="This job posting does not exist." />
      </PageBody>
    )
  }

  const active = job.applications.filter((a) => ACTIVE_STAGES.includes(a.stage)).length
  const avgMatch = job.applications.length
    ? job.applications.reduce((sum, a) => sum + a.skillMatch.score, 0) / job.applications.length
    : 0

  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <Link to="/jobs" className="hover:text-mast-ink">Jobs</Link> <span aria-hidden>/</span> {job.company.name}
          </nav>
        }
        title={job.title}
        subtitle={
          <>
            {[WORK_MODE_LABEL[job.workMode], EMPLOYMENT_LABEL[job.employmentType], job.location, formatSalary(job.salary)]
              .filter(Boolean)
              .map((item) => <span key={item}>{item}</span>)}
            {job.publishedAt && <span>Opened {timeAgo(job.publishedAt)}</span>}
          </>
        }
        actions={job.status !== 'OPEN' && <Badge className="bg-mast-2 text-mast-ink ring-mast-line">{job.status === 'DRAFT' ? 'Draft' : 'Closed'}</Badge>}
      >
        <StageStrip byStage={job.pipeline.byStage} total={job.pipeline.total} />
      </PageHeader>

      <PageBody>
        <section aria-labelledby="board-title">
          <SectionTitle id="board-title" aside="Drag a card to a highlighted column, or use its Move menu.">
            Pipeline
          </SectionTitle>
          <PipelineBoard applications={applications} onMove={handleMove} pendingIds={pendingIds} />
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="role-title">
            <SectionTitle id="role-title">About the role</SectionTitle>
            <Card marks className="p-6">
              <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <Stat label="Applicants" value={job.pipeline.total} />
                <Stat label="In progress" value={active} />
                <Stat label="Hire rate" value={formatPercent(job.pipeline.hireRate)} />
                <Stat label="Avg. match" value={formatPercent(avgMatch)} />
              </dl>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => <SkillTag key={skill} skill={skill} />)}
              </div>
              <p className="mt-5 max-w-prose text-[0.95rem] leading-relaxed text-ink-2">{job.description}</p>
            </Card>
          </section>

          <ActivityFeed jobPostingId={job.id} onEvent={handleRemoteEvent} />
        </div>
      </PageBody>
    </>
  )
}
