import { Link, useParams } from 'react-router'
import { useQuery } from 'urql'
import { Card, Chip, EmptyState, ErrorState, PageBody, PageHeader, SectionTitle, SkillTag, Skeleton, StageBadge } from '../../components/ui'
import { WORK_MODE_LABEL, timeAgo } from '../../lib/format'
import { rise } from '../../lib/motion'
import { STAGE_LABEL } from '../../lib/stages'
import { SkillMatchBar } from './SkillMatchBar'
import { CandidateProfileQuery } from './operations'

export function CandidatePage() {
  const { candidateId = '' } = useParams()
  const [{ data, fetching, error }, refetch] = useQuery({ query: CandidateProfileQuery, variables: { id: candidateId } })

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
        <div className="h-56 bg-mast" />
        <PageBody>
          <Skeleton className="h-96" />
        </PageBody>
      </>
    )
  }
  const candidate = data?.candidate
  if (!candidate) {
    return (
      <PageBody>
        <ErrorState message="This candidate does not exist." />
      </PageBody>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <nav aria-label="Breadcrumb">
            <Link to="/candidates" className="hover:text-mast-ink">Candidates</Link> <span aria-hidden>/</span> Profile
          </nav>
        }
        title={candidate.fullName}
        subtitle={
          <>
            {candidate.headline && <span>{candidate.headline}</span>}
            <span>{candidate.yearsOfExperience} years of experience</span>
            <span>{candidate.email}</span>
          </>
        }
      >
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1.5 px-4 pb-8 md:px-8">
          {candidate.skills.map((s) => (
            <span key={s} className="label-caps rounded-sm border border-mast-line px-2.5 py-1 text-[0.72rem] text-mast-ink">{s}</span>
          ))}
        </div>
      </PageHeader>

      <PageBody>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="applications-title">
            <SectionTitle id="applications-title" aside={candidate.applications.length}>Applications</SectionTitle>
            {candidate.applications.length === 0 && <EmptyState title="No applications yet" />}
            <div className="space-y-5">
              {candidate.applications.map((a, i) => {
                const entrance = rise(i)
                return (
                  <Card key={a.id} marks className={`${entrance.className} p-5`} style={entrance.style}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="label-caps text-ink-3">{a.job.company.name}</p>
                        <Link to={`/jobs/${a.job.id}`} className="font-display text-2xl leading-tight font-semibold text-ink hover:text-accent">{a.job.title}</Link>
                        <p className="text-sm text-ink-3">Applied {timeAgo(a.appliedAt)}</p>
                      </div>
                      <StageBadge stage={a.stage} />
                    </div>

                    <div className="mt-5">
                      <SkillMatchBar score={a.skillMatch.score} label={`Skill match for ${a.job.title}`} />
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.skillMatch.matchedSkills.map((s) => <SkillTag key={s} skill={s} state="matched" />)}
                        {a.skillMatch.missingSkills.map((s) => <SkillTag key={s} skill={s} state="missing" />)}
                      </div>
                    </div>

                    <ol className="mt-5 border-l border-rule pl-4" aria-label="Stage history">
                      {a.history.map((h) => (
                        <li key={h.changedAt + h.to} className="relative pb-3 text-sm last:pb-0">
                          <span className="absolute top-1.5 -left-[1.2rem] size-1.5 bg-accent" aria-hidden />
                          <span className="label-caps text-ink">{STAGE_LABEL[h.to]}</span>{' '}
                          <span className="text-ink-3">{timeAgo(h.changedAt)}</span>
                          {h.note && <span className="block text-ink-2">“{h.note}”</span>}
                        </li>
                      ))}
                    </ol>
                  </Card>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="recommended-title">
            <SectionTitle id="recommended-title">Recommended jobs</SectionTitle>
            {candidate.recommendedJobs.length === 0 && <EmptyState title="No matching open roles" />}
            <div className="space-y-4">
              {candidate.recommendedJobs.map(({ job, match }, i) => {
                const entrance = rise(i + 2)
                return (
                  <Card key={job.id} marks className={`${entrance.className} p-4`} style={entrance.style}>
                    <p className="label-caps text-ink-3">{job.company.name} · {WORK_MODE_LABEL[job.workMode]}</p>
                    <Link to={`/jobs/${job.id}`} className="font-display text-xl leading-tight font-semibold text-ink hover:text-accent">{job.title}</Link>
                    <div className="mt-3">
                      <SkillMatchBar score={match.score} label={`Skill match for ${job.title}`} />
                    </div>
                    {match.missingSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="label-caps text-[0.7rem] text-ink-3">Missing</span>
                        {match.missingSkills.map((s) => <Chip key={s}>{s}</Chip>)}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>
        </div>
      </PageBody>
    </>
  )
}
