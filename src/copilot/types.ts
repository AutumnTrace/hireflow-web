// Response shapes of the HireFlow Copilot API (https://github.com/AutumnTrace/hireflow-copilot).

export type CopilotEndpoint = 'ask' | 'agent'

export interface CopilotSource {
  number: number
  title: string
  /** hireflow://jobs/{id}, hireflow://candidates/{id} or hireflow://applications/{id} */
  source: string
  quotes: string[]
  job_id?: string | null
  candidate_id?: string | null
}

export interface CopilotToolCall {
  name: string
  input: Record<string, unknown>
  is_error: boolean
}

export interface MoveApplicationProposal {
  id: string
  kind: 'move_application'
  summary: string
  params: { application_id: string; stage: string; note: string | null }
  confirm_url: string
}

export interface ScheduleInterviewProposal {
  id: string
  kind: 'schedule_interview'
  summary: string
  params: Record<string, unknown>
  confirm_url: string
}

export type CopilotProposal = MoveApplicationProposal | ScheduleInterviewProposal

export interface CopilotUsage {
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cost_usd: number
}

/** Union of the /v1/ask and /v1/agent responses; agent-only fields are optional. */
export interface CopilotResponse {
  answer: string
  sources: CopilotSource[]
  usage: CopilotUsage
  mode?: string
  stop?: string
  steps?: number
  tool_calls?: CopilotToolCall[]
  proposed_actions?: CopilotProposal[]
}

export interface Recording {
  recordedAt: string
  model: string
  items: { id: string; endpoint: CopilotEndpoint; question: string; response: CopilotResponse }[]
}
