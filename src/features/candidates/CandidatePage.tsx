import { Link, useParams } from 'react-router'
import { useQuery } from 'urql'
import { Avatar, Card, EmptyState, ErrorState, SkillTag, Skeleton, StageBadge } from '../../components/ui'
import { WORK_MODE_LABEL, timeAgo } from '../../lib/format'
import { STAGE_LABEL } from '../../lib/stages'
import { SkillMatchBar } from './SkillMatchBar'
import { CandidateProfileQuery } from './operations'

export function CandidatePage() {
  const { candidateId = '' } = useParams()
  const [{ data, fetching, error }, refetch] = useQuery({ query: CandidateProfileQuery, variables: { id: candidateId } })

  if (error) return <ErrorState message={error.message} onRetry={() => refetch({ requestPolicy: 'network-only' })} />
  if (fetching && !data) return <Skeleton className="h-96" />
  const candidate = data?.candidate
  if (!candidate) return <ErrorState message="This candidate does not exist." />

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-3">
        <Link to="/candidates" className="hover:text-accent">Candidates</Link> <span aria-hidden>/</span> {candidate.fullName}
      </nav>

      <Card className="mb-6 flex flex-wrap items-center gap-5 p-6">
        <Avatar name={candidate.fullName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{candidate.fullName}</h1>
          <p className="text-ink-2">{candidate.headline} · {candidate.yearsOfExperience} years of experience</p>
          <p className="text-sm text-ink-3">{candidate.email}</p>
        </div>
        <div className="flex max-w-md flex-wrap gap-1.5">
          {candidate.skills.map((s) => <SkillTag key={s} skill={s} />)}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="applications-title">
          <h2 id="applications-title" className="mb-3 text-lg font-semibold text-ink">Applications</h2>
          {candidate.applications.length === 0 && <EmptyState title="No applications yet" />}
          <div className="space-y-4">
            {candidate.applications.map((a) => (
              <Card key={a.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link to={`/jobs/${a.job.id}`} className="font-medium text-ink hover:text-accent">{a.job.title}</Link>
                    <p className="text-sm text-ink-2">{a.job.company.name} · applied {timeAgo(a.appliedAt)}</p>
                  </div>
                  <StageBadge stage={a.stage} />
                </div>

                <div className="mt-4">
                  <SkillMatchBar score={a.skillMatch.score} label={`Skill match for ${a.job.title}`} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.skillMatch.matchedSkills.map((s) => <SkillTag key={s} skill={s} state="matched" />)}
                    {a.skillMatch.missingSkills.map((s) => <SkillTag key={s} skill={s} state="missing" />)}
                  </div>
                </div>

                <ol className="mt-4 border-l border-line pl-4" aria-label="Stage history">
                  {a.history.map((h) => (
                    <li key={h.changedAt + h.to} className="relative pb-2 text-sm last:pb-0">
                      <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-line" aria-hidden />
                      <span className="font-medium text-ink">{STAGE_LABEL[h.to]}</span>{' '}
                      <span className="text-ink-3">{timeAgo(h.changedAt)}</span>
                      {h.note && <span className="block text-ink-2">“{h.note}”</span>}
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="recommended-title">
          <h2 id="recommended-title" className="mb-3 text-lg font-semibold text-ink">Recommended jobs</h2>
          {candidate.recommendedJobs.length === 0 && <EmptyState title="No matching open roles" />}
          <div className="space-y-3">
            {candidate.recommendedJobs.map(({ job, match }) => (
              <Card key={job.id} className="p-4">
                <Link to={`/jobs/${job.id}`} className="font-medium text-ink hover:text-accent">{job.title}</Link>
                <p className="mb-3 text-sm text-ink-2">{job.company.name} · {WORK_MODE_LABEL[job.workMode]}</p>
                <SkillMatchBar score={match.score} label={`Skill match for ${job.title}`} />
                {match.missingSkills.length > 0 && (
                  <p className="mt-2 text-xs text-ink-3">Missing: {match.missingSkills.join(', ')}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
