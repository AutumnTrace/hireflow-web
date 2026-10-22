import { makeExecutableSchema } from '@graphql-tools/schema'
import type { ApplicationStage } from '../gql/graphql'
import { ACTIVE_STAGES, STAGES } from '../lib/stages'
import typeDefs from '../../schema.graphql?raw'
import type { ApplicationRow, CandidateRow, DemoStore, InterviewRow, JobRow } from './data'
import { createPubSub, type PubSub } from './pubsub'
import { connection, filterRows, sortRows, type PagingArgs } from './query'

/** Same transition table as HireFlow.Domain.ApplicationStageRules. */
const TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  APPLIED: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['HIRED', 'REJECTED', 'WITHDRAWN'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
}

const LABEL = (stage: ApplicationStage) => stage.charAt(0) + stage.slice(1).toLowerCase()

type ListArgs = PagingArgs & { where?: Record<string, unknown> | null; order?: Record<string, unknown>[] | null }

export function skillMatch(required: readonly string[], offered: readonly string[]) {
  const have = new Set(offered.map((s) => s.toLowerCase()))
  const matchedSkills = required.filter((s) => have.has(s.toLowerCase()))
  const missingSkills = required.filter((s) => !have.has(s.toLowerCase()))
  const score = required.length === 0 ? 1 : Math.round((matchedSkills.length / required.length) * 1000) / 1000
  return { score, matchedSkills, missingSkills }
}

/**
 * Executable copy of the HireFlow schema backed by an in-memory store. It implements the
 * fields the web app uses with the same rules as the API (state machine, typed errors,
 * paging, filtering, subscriptions), so demo mode behaves like the real thing.
 */
export function createDemoSchema(store: DemoStore, pubsub: PubSub = createPubSub()) {
  const byId = <T extends { id: string }>(rows: T[], id: string) => rows.find((r) => r.id === id) ?? null
  const list = <T,>(rows: T[], args: ListArgs, fallbackOrder?: Record<string, unknown>[]) =>
    connection(sortRows(filterRows(rows, args.where), args.order ?? fallbackOrder), args)

  const candidateOf = (a: ApplicationRow) => byId(store.candidates, a.candidateId)!
  const jobOf = (a: ApplicationRow) => byId(store.jobs, a.jobPostingId)!
  const newest = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt)

  const resolvers = {
    Query: {
      companies: (_: unknown, args: ListArgs) => list(store.companies, args, [{ name: 'ASC' }]),
      company: (_: unknown, { id }: { id: string }) => byId(store.companies, id),
      jobs: (_: unknown, args: ListArgs) => list(store.jobs, args, [{ publishedAt: 'DESC' }]),
      job: (_: unknown, { id }: { id: string }) => byId(store.jobs, id),
      candidates: (_: unknown, args: ListArgs) => list(store.candidates, args, [{ fullName: 'ASC' }]),
      candidate: (_: unknown, { id }: { id: string }) => byId(store.candidates, id),
      applications: (_: unknown, args: ListArgs) => list(store.applications, args, [{ updatedAt: 'DESC' }]),
      application: (_: unknown, { id }: { id: string }) => byId(store.applications, id),
      interviews: (_: unknown, args: ListArgs) => list(store.interviews, args, [{ scheduledAt: 'ASC' }]),
      upcomingInterviews: (_: unknown, { days = 7, interviewer }: { days?: number; interviewer?: string | null }) => {
        const now = new Date()
        const until = new Date(now.getTime() + Math.min(Math.max(days, 1), 90) * 86_400_000)
        return store.interviews
          .filter((i) => new Date(i.scheduledAt) >= now && new Date(i.scheduledAt) < until)
          .filter((i) => !interviewer || i.interviewer === interviewer.trim())
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      },
    },

    Company: {
      jobs: (c: { id: string }, { status }: { status?: string | null }) =>
        store.jobs.filter((j) => j.companyId === c.id && (!status || j.status === status)),
    },

    JobPosting: {
      company: (j: JobRow) => byId(store.companies, j.companyId),
      applications: (j: JobRow, { stage }: { stage?: ApplicationStage | null }) =>
        store.applications.filter((a) => a.jobPostingId === j.id && (!stage || a.stage === stage)).sort(newest),
      pipeline: (j: JobRow) => {
        const apps = store.applications.filter((a) => a.jobPostingId === j.id)
        const byStage = STAGES.map((stage) => ({ stage, count: apps.filter((a) => a.stage === stage).length }))
        const hired = apps.filter((a) => a.stage === 'HIRED').length
        return { total: apps.length, byStage, hireRate: apps.length ? Math.round((hired / apps.length) * 1000) / 1000 : 0 }
      },
    },

    JobApplication: {
      job: jobOf,
      candidate: candidateOf,
      isActive: (a: ApplicationRow) => ACTIVE_STAGES.includes(a.stage),
      allowedNextStages: (a: ApplicationRow) => TRANSITIONS[a.stage],
      history: (a: ApplicationRow) =>
        store.transitions.filter((t) => t.applicationId === a.id).sort((x, y) => x.changedAt.localeCompare(y.changedAt)),
      interviews: (a: ApplicationRow) =>
        store.interviews.filter((i) => i.applicationId === a.id).sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt)),
      skillMatch: (a: ApplicationRow) => skillMatch(jobOf(a).requiredSkills, candidateOf(a).skills),
    },

    Candidate: {
      applications: (c: CandidateRow) => store.applications.filter((a) => a.candidateId === c.id).sort(newest),
      recommendedJobs: (c: CandidateRow, { limit = 5 }: { limit?: number }) => {
        const appliedTo = new Set(store.applications.filter((a) => a.candidateId === c.id).map((a) => a.jobPostingId))
        return store.jobs
          .filter((j) => j.status === 'OPEN' && !appliedTo.has(j.id))
          .map((job) => ({ job, match: skillMatch(job.requiredSkills, c.skills) }))
          .filter((r) => r.match.matchedSkills.length > 0)
          .sort((a, b) => b.match.score - a.match.score || b.match.matchedSkills.length - a.match.matchedSkills.length)
          .slice(0, Math.min(Math.max(limit, 1), 20))
      },
    },

    Interview: {
      application: (i: InterviewRow) => byId(store.applications, i.applicationId),
    },

    ApplicationStageChanged: {
      application: (e: { applicationId: string }) => byId(store.applications, e.applicationId),
    },

    Mutation: {
      moveApplication: (
        _: unknown,
        { input }: { input: { applicationId: string; stage: ApplicationStage; note?: string | null } },
      ) => {
        const application = byId(store.applications, input.applicationId)
        if (!application) {
          return {
            jobApplication: null,
            errors: [{ __typename: 'EntityNotFoundError', message: `JobApplication '${input.applicationId}' was not found.`, entity: 'JobApplication', entityId: input.applicationId }],
          }
        }

        const allowed = TRANSITIONS[application.stage]
        if (!allowed.includes(input.stage)) {
          const hint = allowed.length === 0 ? `${LABEL(application.stage)} is a final stage.` : `Allowed: ${allowed.map(LABEL).join(', ')}.`
          return {
            jobApplication: null,
            errors: [{
              __typename: 'InvalidStageTransitionError',
              message: `Cannot move an application from ${LABEL(application.stage)} to ${LABEL(input.stage)}. ${hint}`,
              applicationId: application.id,
              from: application.stage,
              to: input.stage,
              allowedStages: allowed,
            }],
          }
        }

        const changedAt = new Date().toISOString()
        const transition = { id: store.nextId(), applicationId: application.id, from: application.stage, to: input.stage, note: input.note?.trim() || null, changedAt }
        store.transitions.push(transition)
        application.stage = input.stage
        application.updatedAt = changedAt

        pubsub.publish(`job:${application.jobPostingId}:stage-changed`, {
          applicationId: application.id,
          jobPostingId: application.jobPostingId,
          from: transition.from,
          to: transition.to,
          note: transition.note,
          changedAt,
        })
        return { jobApplication: application, errors: null }
      },
    },

    Subscription: {
      onApplicationStageChanged: {
        subscribe: (_: unknown, { jobPostingId }: { jobPostingId: string }) => pubsub.subscribe(`job:${jobPostingId}:stage-changed`),
        resolve: (payload: unknown) => payload,
      },
      onApplicationSubmitted: {
        subscribe: (_: unknown, { jobPostingId }: { jobPostingId: string }) => pubsub.subscribe(`job:${jobPostingId}:application-submitted`),
        resolve: (payload: unknown) => payload,
      },
    },
  }

  return makeExecutableSchema({ typeDefs, resolvers })
}
