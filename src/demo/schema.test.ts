import { graphql, parse, subscribe, type ExecutionResult } from 'graphql'
import { createDemoStore } from './data'
import { createPubSub } from './pubsub'
import { createDemoSchema, skillMatch } from './schema'

function setup() {
  const store = createDemoStore(new Date('2026-10-22T12:00:00Z'))
  const pubsub = createPubSub()
  const schema = createDemoSchema(store, pubsub)
  const run = async (source: string, variableValues?: Record<string, unknown>) => {
    const result = await graphql({ schema, source, variableValues })
    expect(result.errors).toBeUndefined()
    return result.data as Record<string, any>
  }
  return { store, schema, run }
}

const MOVE = `
  mutation ($id: UUID!, $stage: ApplicationStage!) {
    moveApplication(input: { applicationId: $id, stage: $stage }) {
      jobApplication { id stage allowedNextStages }
      errors { __typename ... on Error { message } ... on InvalidStageTransitionError { from to allowedStages } }
    }
  }`

describe('demo schema', () => {
  it('executes against the real HireFlow SDL with paging and filtering', async () => {
    const { run } = setup()
    const data = await run(`{ jobs(where: { status: { eq: OPEN } }, first: 3) { totalCount nodes { title company { name } } pageInfo { hasNextPage } } }`)

    expect(data.jobs.totalCount).toBe(6)
    expect(data.jobs.nodes).toHaveLength(3)
    expect(data.jobs.pageInfo.hasNextPage).toBe(true)
    expect(data.jobs.nodes[0].company.name).toBeTruthy()
  })

  it('applies the pipeline state machine and records history', async () => {
    const { store, run } = setup()
    const app = store.applications.find((a) => a.stage === 'APPLIED')!

    const ok = await run(MOVE, { id: app.id, stage: 'SCREENING' })
    expect(ok.moveApplication.errors).toBeNull()
    expect(ok.moveApplication.jobApplication.stage).toBe('SCREENING')
    expect(ok.moveApplication.jobApplication.allowedNextStages).toEqual(['INTERVIEW', 'REJECTED', 'WITHDRAWN'])
    expect(store.transitions.filter((t) => t.applicationId === app.id).at(-1)).toMatchObject({ from: 'APPLIED', to: 'SCREENING' })
  })

  it('returns typed errors for illegal transitions, like the API', async () => {
    const { store, run } = setup()
    const app = store.applications.find((a) => a.stage === 'APPLIED')!

    const result = await run(MOVE, { id: app.id, stage: 'HIRED' })

    expect(result.moveApplication.jobApplication).toBeNull()
    expect(result.moveApplication.errors[0]).toEqual({
      __typename: 'InvalidStageTransitionError',
      message: 'Cannot move an application from Applied to Hired. Allowed: Screening, Rejected, Withdrawn.',
      from: 'APPLIED',
      to: 'HIRED',
      allowedStages: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
    })
    expect(app.stage).toBe('APPLIED')
  })

  it('pushes stage changes to subscribers', async () => {
    const { store, schema, run } = setup()
    const app = store.applications.find((a) => a.stage === 'APPLIED')!

    const stream = (await subscribe({
      schema,
      document: parse(`subscription ($job: UUID!) { onApplicationStageChanged(jobPostingId: $job) { from to application { id } } }`),
      variableValues: { job: app.jobPostingId },
    })) as AsyncIterableIterator<ExecutionResult>

    const next = stream.next()
    await run(MOVE, { id: app.id, stage: 'SCREENING' })
    const event = await next

    expect(event.value.data.onApplicationStageChanged).toEqual({ from: 'APPLIED', to: 'SCREENING', application: { id: app.id } })
    await stream.return?.()
  })

  it('ranks recommended jobs by skill match and skips jobs already applied to', async () => {
    const { store, run } = setup()
    const ana = store.candidates.find((c) => c.fullName === 'Ana Popescu')!
    const data = await run(`query ($id: UUID!) { candidate(id: $id) { applications { job { id } } recommendedJobs { job { id } match { score } } } }`, { id: ana.id })

    const applied = new Set(data.candidate.applications.map((a: any) => a.job.id))
    const scores = data.candidate.recommendedJobs.map((r: any) => r.match.score)
    expect(data.candidate.recommendedJobs.every((r: any) => !applied.has(r.job.id))).toBe(true)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })
})

const SCHEDULE = `
  mutation ($input: ScheduleInterviewInput!) {
    scheduleInterview(input: $input) {
      interview { id kind scheduledAt durationMinutes interviewer application { id } }
      errors { __typename ... on Error { message } ... on DomainValidationError { field } ... on ApplicationClosedError { stage } }
    }
  }`

describe('demo scheduleInterview', () => {
  const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString()
  const applicationOf = (store: ReturnType<typeof setup>['store'], stage: string) => store.applications.find((a) => a.stage === stage)!

  it('adds the interview to the upcoming agenda', async () => {
    const { store, run } = setup()
    const app = applicationOf(store, 'INTERVIEW')
    const at = tomorrow()
    const data = await run(SCHEDULE, { input: { applicationId: app.id, kind: 'TECHNICAL', scheduledAt: at, durationMinutes: 60, interviewer: '  Irina Balan ' } })

    expect(data.scheduleInterview.errors).toBeNull()
    expect(data.scheduleInterview.interview).toMatchObject({ kind: 'TECHNICAL', scheduledAt: at, durationMinutes: 60, interviewer: 'Irina Balan', application: { id: app.id } })
    const agenda = await run(`{ upcomingInterviews(days: 2) { id } }`)
    expect(agenda.upcomingInterviews.map((i: any) => i.id)).toContain(data.scheduleInterview.interview.id)
  })

  it('refuses closed applications, unknown ids and out-of-range durations, like the API', async () => {
    const { store, run } = setup()
    const before = store.interviews.length
    const input = { kind: 'PHONE_SCREEN', scheduledAt: tomorrow(), durationMinutes: 30, interviewer: 'Irina Balan' }

    const closed = await run(SCHEDULE, { input: { ...input, applicationId: applicationOf(store, 'REJECTED').id } })
    expect(closed.scheduleInterview.errors).toEqual([{ __typename: 'ApplicationClosedError', message: 'Application is already closed (Rejected).', stage: 'REJECTED' }])

    const missing = await run(SCHEDULE, { input: { ...input, applicationId: '00000000-0000-4000-8000-0000000fffff' } })
    expect(missing.scheduleInterview.errors[0].__typename).toBe('EntityNotFoundError')

    const active = applicationOf(store, 'SCREENING').id
    const tooLong = await run(SCHEDULE, { input: { ...input, applicationId: active, durationMinutes: 481 } })
    expect(tooLong.scheduleInterview.errors).toEqual([{ __typename: 'DomainValidationError', message: 'Interviews must last between 15 minutes and 8 hours.', field: 'durationMinutes' }])

    const nobody = await run(SCHEDULE, { input: { ...input, applicationId: active, interviewer: '   ' } })
    expect(nobody.scheduleInterview.errors[0]).toMatchObject({ field: 'interviewer' })
    expect(store.interviews).toHaveLength(before)
  })
})

describe('skillMatch', () => {
  it('matches case-insensitively and reports gaps', () => {
    expect(skillMatch(['C#', 'GraphQL', 'SQL', 'Docker'], ['c#', 'sql'])).toEqual({
      score: 0.5,
      matchedSkills: ['C#', 'SQL'],
      missingSkills: ['GraphQL', 'Docker'],
    })
    expect(skillMatch([], ['C#']).score).toBe(1)
  })
})
