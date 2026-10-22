import type {
  ApplicationStage,
  EmploymentType,
  InterviewKind,
  JobStatus,
  WorkMode,
} from '../gql/graphql'

export interface CompanyRow {
  id: string
  name: string
  website: string | null
  industry: string | null
  location: string | null
  createdAt: string
}

export interface JobRow {
  id: string
  companyId: string
  title: string
  description: string
  location: string | null
  workMode: WorkMode
  employmentType: EmploymentType
  salary: { min: number; max: number; currency: string } | null
  requiredSkills: string[]
  status: JobStatus
  createdAt: string
  publishedAt: string | null
  closedAt: string | null
}

export interface CandidateRow {
  id: string
  fullName: string
  email: string
  headline: string | null
  yearsOfExperience: number
  skills: string[]
  createdAt: string
}

export interface ApplicationRow {
  id: string
  jobPostingId: string
  candidateId: string
  stage: ApplicationStage
  coverLetter: string | null
  appliedAt: string
  updatedAt: string
}

export interface TransitionRow {
  id: string
  applicationId: string
  from: ApplicationStage | null
  to: ApplicationStage
  note: string | null
  changedAt: string
}

export interface InterviewRow {
  id: string
  applicationId: string
  kind: InterviewKind
  scheduledAt: string
  durationMinutes: number
  interviewer: string
  rating: number | null
  feedback: string | null
  feedbackSubmittedAt: string | null
}

export interface DemoStore {
  companies: CompanyRow[]
  jobs: JobRow[]
  candidates: CandidateRow[]
  applications: ApplicationRow[]
  transitions: TransitionRow[]
  interviews: InterviewRow[]
  nextId: () => string
}

const HAPPY_PATH: ApplicationStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED']

/** Builds a fresh, deterministic dataset. Dates are relative to `now` so the demo never looks stale. */
export function createDemoStore(now: Date = new Date()): DemoStore {
  let counter = 0
  const nextId = () => `00000000-0000-4000-8000-${(++counter).toString(16).padStart(12, '0')}`
  const daysAgo = (days: number, hours = 10) => {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - days)
    d.setUTCHours(hours, 0, 0, 0)
    return d.toISOString()
  }

  const company = (name: string, industry: string, location: string): CompanyRow => ({
    id: nextId(),
    name,
    industry,
    location,
    website: `https://${name.split(' ')[0]!.toLowerCase()}.example`,
    createdAt: daysAgo(120),
  })

  const northwind = company('Northwind Labs', 'Developer Tools', 'Chișinău, MD')
  const bluefin = company('Bluefin Analytics', 'Data & AI', 'Bucharest, RO')
  const orbit = company('Orbit Commerce', 'E-commerce', 'Remote (EU)')
  const lumen = company('Lumen Health', 'HealthTech', 'Berlin, DE')

  const job = (
    c: CompanyRow,
    title: string,
    description: string,
    workMode: WorkMode,
    employmentType: EmploymentType,
    salary: JobRow['salary'],
    requiredSkills: string[],
    status: JobStatus,
    publishedDaysAgo: number,
    location: string | null = c.location,
  ): JobRow => ({
    id: nextId(),
    companyId: c.id,
    title,
    description,
    location,
    workMode,
    employmentType,
    salary,
    requiredSkills,
    status,
    createdAt: daysAgo(publishedDaysAgo + 2),
    publishedAt: status === 'DRAFT' ? null : daysAgo(publishedDaysAgo),
    closedAt: status === 'CLOSED' ? daysAgo(2) : null,
  })

  const seniorNet = job(northwind, 'Senior .NET Engineer',
    'Own our GraphQL gateway and the services behind it. You will design schemas, tune EF Core queries and mentor two engineers.',
    'HYBRID', 'FULL_TIME', { min: 42_000, max: 60_000, currency: 'EUR' }, ['C#', '.NET', 'GraphQL', 'PostgreSQL'], 'OPEN', 21)
  const fullStack = job(northwind, 'Full-Stack Developer (.NET + React)',
    'Ship features end to end across our React front end and ASP.NET Core APIs.',
    'ONSITE', 'FULL_TIME', { min: 30_000, max: 45_000, currency: 'EUR' }, ['C#', 'React', 'TypeScript', 'SQL'], 'OPEN', 14)
  const frontend = job(orbit, 'Frontend Engineer (React)',
    'Build the storefront and merchant dashboard in React and TypeScript, backed by a GraphQL API.',
    'REMOTE', 'FULL_TIME', { min: 38_000, max: 55_000, currency: 'EUR' }, ['React', 'TypeScript', 'GraphQL', 'Testing'], 'OPEN', 9, null)
  const dataEng = job(bluefin, 'Data Platform Engineer',
    'Build ingestion pipelines and the APIs our analysts query every day.',
    'REMOTE', 'FULL_TIME', { min: 50_000, max: 70_000, currency: 'EUR' }, ['Python', 'SQL', 'Kafka'], 'OPEN', 30)
  const qa = job(lumen, 'QA Automation Engineer',
    'Own end-to-end test coverage for our patient-facing apps with Playwright and xUnit.',
    'HYBRID', 'FULL_TIME', { min: 35_000, max: 48_000, currency: 'EUR' }, ['Playwright', 'TypeScript', 'C#'], 'OPEN', 5)
  const intern = job(orbit, 'Backend Intern',
    'Six-month internship working on order processing in .NET.',
    'REMOTE', 'INTERNSHIP', null, ['C#'], 'OPEN', 12, null)
  const consultant = job(orbit, 'GraphQL Consultant',
    'Three-month contract to migrate our REST storefront API to GraphQL.',
    'REMOTE', 'CONTRACT', { min: 6_000, max: 9_000, currency: 'EUR' }, ['GraphQL', 'Hot Chocolate'], 'CLOSED', 40, null)
  const ml = job(bluefin, 'ML Engineer', 'Draft posting, not yet published.', 'HYBRID', 'FULL_TIME', null, ['Python', 'PyTorch'], 'DRAFT', 0)

  const candidate = (fullName: string, headline: string, yearsOfExperience: number, skills: string[]): CandidateRow => ({
    id: nextId(),
    fullName,
    email: `${fullName.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    headline,
    yearsOfExperience,
    skills,
    createdAt: daysAgo(40),
  })

  const ana = candidate('Ana Popescu', 'Backend engineer, 6 years in .NET', 6, ['C#', '.NET', 'SQL', 'Docker'])
  const ion = candidate('Ion Rusu', 'Full-stack developer', 4, ['React', 'C#', 'TypeScript'])
  const elena = candidate('Elena Ciobanu', 'Data engineer', 5, ['Python', 'Kafka', 'SQL'])
  const mihai = candidate('Mihai Lungu', 'CS student', 0, ['C#'])
  const daria = candidate('Daria Munteanu', 'Senior backend engineer, GraphQL enthusiast', 8, ['C#', '.NET', 'GraphQL', 'PostgreSQL', 'Kubernetes'])
  const victor = candidate('Victor Ceban', 'Platform engineer', 7, ['.NET', 'PostgreSQL', 'Azure'])
  const irina = candidate('Irina Botnari', 'Frontend engineer, design systems', 5, ['React', 'TypeScript', 'Testing', 'CSS'])
  const andrei = candidate('Andrei Rotaru', 'React developer', 3, ['React', 'JavaScript', 'GraphQL'])
  const sofia = candidate('Sofia Gheorghiu', 'QA engineer', 4, ['Playwright', 'TypeScript', 'Cypress'])
  const radu = candidate('Radu Stoica', 'Full-stack .NET developer', 6, ['C#', 'React', 'SQL', 'TypeScript'])
  const nicoleta = candidate('Nicoleta Turcan', 'Software engineer', 2, ['C#', 'SQL'])
  const pavel = candidate('Pavel Cojocaru', 'Analytics engineer', 3, ['SQL', 'Python', 'dbt'])
  const cristina = candidate('Cristina Melnic', 'Senior .NET developer', 9, ['C#', '.NET', 'SQL', 'GraphQL'])
  const alex = candidate('Alexandru Vrabie', 'Junior frontend developer', 1, ['React', 'TypeScript'])

  const applications: ApplicationRow[] = []
  const transitions: TransitionRow[] = []

  /** Walks the pipeline to `target`, recording one transition per step, ending `lastDaysAgo` days ago. */
  const apply = (j: JobRow, c: CandidateRow, target: ApplicationStage, appliedDaysAgo: number, notes: Partial<Record<ApplicationStage, string>> = {}) => {
    const id = nextId()
    const path = HAPPY_PATH.includes(target)
      ? HAPPY_PATH.slice(0, HAPPY_PATH.indexOf(target) + 1)
      : [...HAPPY_PATH.slice(0, 2), target]
    const step = Math.max(1, Math.floor(appliedDaysAgo / path.length))

    path.forEach((stage, i) => {
      transitions.push({
        id: nextId(),
        applicationId: id,
        from: i === 0 ? null : path[i - 1]!,
        to: stage,
        note: notes[stage] ?? null,
        changedAt: daysAgo(appliedDaysAgo - i * step, 9 + i),
      })
    })

    const updatedAt = transitions[transitions.length - 1]!.changedAt
    applications.push({ id, jobPostingId: j.id, candidateId: c.id, stage: target, coverLetter: null, appliedAt: daysAgo(appliedDaysAgo, 9), updatedAt })
    return id
  }

  const daria_seniorNet = apply(seniorNet, daria, 'OFFER', 18, { SCREENING: 'Excellent GraphQL depth', OFFER: 'Offer sent: 58k EUR' })
  const ana_seniorNet = apply(seniorNet, ana, 'INTERVIEW', 15, { SCREENING: 'Strong CV' })
  const cristina_seniorNet = apply(seniorNet, cristina, 'INTERVIEW', 12)
  apply(seniorNet, victor, 'SCREENING', 6)
  apply(seniorNet, nicoleta, 'REJECTED', 10, { REJECTED: 'Looking for more senior experience' })
  apply(seniorNet, radu, 'APPLIED', 2)
  apply(seniorNet, mihai, 'APPLIED', 1)

  const radu_fullStack = apply(fullStack, radu, 'INTERVIEW', 11)
  apply(fullStack, ion, 'SCREENING', 7)
  apply(fullStack, alex, 'APPLIED', 3)
  apply(fullStack, nicoleta, 'APPLIED', 2)
  apply(fullStack, andrei, 'WITHDRAWN', 9, { WITHDRAWN: 'Accepted another offer' })

  const irina_frontend = apply(frontend, irina, 'INTERVIEW', 8)
  apply(frontend, andrei, 'SCREENING', 5)
  apply(frontend, alex, 'APPLIED', 1)

  apply(dataEng, elena, 'HIRED', 28, { OFFER: 'Offer sent: 62k EUR', HIRED: 'Starts on the 1st' })
  apply(dataEng, pavel, 'SCREENING', 24) // untouched for ~12 days: shows the "stalled" state

  apply(qa, sofia, 'SCREENING', 3)
  apply(intern, mihai, 'APPLIED', 6)
  apply(consultant, daria, 'REJECTED', 35)

  const interview = (applicationId: string, kind: InterviewKind, inDays: number, hours: number, durationMinutes: number, interviewer: string, rating?: number, feedback?: string): InterviewRow => {
    const scheduledAt = daysAgo(-inDays, hours)
    return {
      id: nextId(),
      applicationId,
      kind,
      scheduledAt,
      durationMinutes,
      interviewer,
      rating: rating ?? null,
      feedback: feedback ?? null,
      feedbackSubmittedAt: rating ? daysAgo(-inDays, hours + 2) : null,
    }
  }

  const interviews: InterviewRow[] = [
    interview(daria_seniorNet, 'PHONE_SCREEN', -14, 11, 30, 'Irina Balan', 5, 'Clear, structured answers.'),
    interview(daria_seniorNet, 'SYSTEM_DESIGN', -8, 13, 90, 'Victor Moraru', 5, 'Designed a federated schema unprompted.'),
    interview(ana_seniorNet, 'PHONE_SCREEN', -9, 10, 30, 'Irina Balan', 4, 'Solid fundamentals.'),
    interview(ana_seniorNet, 'TECHNICAL', 1, 14, 60, 'Victor Moraru'),
    interview(cristina_seniorNet, 'TECHNICAL', 2, 11, 60, 'Victor Moraru'),
    interview(radu_fullStack, 'TECHNICAL', 3, 15, 60, 'Elena Sârbu'),
    interview(radu_fullStack, 'BEHAVIORAL', -2, 12, 45, 'Irina Balan', 3, 'Good collaborator, vague on testing.'),
    interview(irina_frontend, 'ONSITE', 5, 10, 180, 'Tom Becker'),
  ]

  return {
    companies: [northwind, bluefin, orbit, lumen],
    jobs: [seniorNet, fullStack, frontend, dataEng, qa, intern, consultant, ml],
    candidates: [ana, ion, elena, mihai, daria, victor, irina, andrei, sofia, radu, nicoleta, pavel, cristina, alex],
    applications,
    transitions,
    interviews,
    nextId,
  }
}
