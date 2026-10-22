/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ApplicationStage =
  | 'APPLIED'
  | 'HIRED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'SCREENING'
  | 'WITHDRAWN';

export type CandidateFilterInput = {
  and?: Array<CandidateFilterInput> | null | undefined;
  createdAt?: DateTimeOperationFilterInput | null | undefined;
  email?: StringOperationFilterInput | null | undefined;
  fullName?: StringOperationFilterInput | null | undefined;
  headline?: StringOperationFilterInput | null | undefined;
  id?: UuidOperationFilterInput | null | undefined;
  or?: Array<CandidateFilterInput> | null | undefined;
  skills?: ListStringOperationFilterInput | null | undefined;
  yearsOfExperience?: IntOperationFilterInput | null | undefined;
};

export type DateTimeOperationFilterInput = {
  eq?: string | null | undefined;
  gt?: string | null | undefined;
  gte?: string | null | undefined;
  in?: Array<string | null | undefined> | null | undefined;
  lt?: string | null | undefined;
  lte?: string | null | undefined;
  neq?: string | null | undefined;
  ngt?: string | null | undefined;
  ngte?: string | null | undefined;
  nin?: Array<string | null | undefined> | null | undefined;
  nlt?: string | null | undefined;
  nlte?: string | null | undefined;
};

export type EmploymentType =
  | 'CONTRACT'
  | 'FULL_TIME'
  | 'INTERNSHIP'
  | 'PART_TIME';

export type EmploymentTypeOperationFilterInput = {
  eq?: EmploymentType | null | undefined;
  in?: Array<EmploymentType> | null | undefined;
  neq?: EmploymentType | null | undefined;
  nin?: Array<EmploymentType> | null | undefined;
};

export type IntOperationFilterInput = {
  eq?: number | null | undefined;
  gt?: number | null | undefined;
  gte?: number | null | undefined;
  in?: Array<number | null | undefined> | null | undefined;
  lt?: number | null | undefined;
  lte?: number | null | undefined;
  neq?: number | null | undefined;
  ngt?: number | null | undefined;
  ngte?: number | null | undefined;
  nin?: Array<number | null | undefined> | null | undefined;
  nlt?: number | null | undefined;
  nlte?: number | null | undefined;
};

export type InterviewKind =
  | 'BEHAVIORAL'
  | 'ONSITE'
  | 'PHONE_SCREEN'
  | 'SYSTEM_DESIGN'
  | 'TECHNICAL';

export type JobPostingFilterInput = {
  and?: Array<JobPostingFilterInput> | null | undefined;
  closedAt?: DateTimeOperationFilterInput | null | undefined;
  companyId?: UuidOperationFilterInput | null | undefined;
  createdAt?: DateTimeOperationFilterInput | null | undefined;
  description?: StringOperationFilterInput | null | undefined;
  employmentType?: EmploymentTypeOperationFilterInput | null | undefined;
  id?: UuidOperationFilterInput | null | undefined;
  location?: StringOperationFilterInput | null | undefined;
  or?: Array<JobPostingFilterInput> | null | undefined;
  publishedAt?: DateTimeOperationFilterInput | null | undefined;
  requiredSkills?: ListStringOperationFilterInput | null | undefined;
  salary?: SalaryRangeFilterInput | null | undefined;
  status?: JobStatusOperationFilterInput | null | undefined;
  title?: StringOperationFilterInput | null | undefined;
  workMode?: WorkModeOperationFilterInput | null | undefined;
};

export type JobStatus =
  | 'CLOSED'
  | 'DRAFT'
  | 'OPEN';

export type JobStatusOperationFilterInput = {
  eq?: JobStatus | null | undefined;
  in?: Array<JobStatus> | null | undefined;
  neq?: JobStatus | null | undefined;
  nin?: Array<JobStatus> | null | undefined;
};

export type ListStringOperationFilterInput = {
  all?: StringOperationFilterInput | null | undefined;
  any?: boolean | null | undefined;
  none?: StringOperationFilterInput | null | undefined;
  some?: StringOperationFilterInput | null | undefined;
};

export type SalaryRangeFilterInput = {
  and?: Array<SalaryRangeFilterInput> | null | undefined;
  currency?: StringOperationFilterInput | null | undefined;
  max?: IntOperationFilterInput | null | undefined;
  min?: IntOperationFilterInput | null | undefined;
  or?: Array<SalaryRangeFilterInput> | null | undefined;
};

export type StringOperationFilterInput = {
  and?: Array<StringOperationFilterInput> | null | undefined;
  contains?: string | null | undefined;
  endsWith?: string | null | undefined;
  eq?: string | null | undefined;
  in?: Array<string | null | undefined> | null | undefined;
  ncontains?: string | null | undefined;
  nendsWith?: string | null | undefined;
  neq?: string | null | undefined;
  nin?: Array<string | null | undefined> | null | undefined;
  nstartsWith?: string | null | undefined;
  or?: Array<StringOperationFilterInput> | null | undefined;
  startsWith?: string | null | undefined;
};

export type UuidOperationFilterInput = {
  eq?: string | null | undefined;
  gt?: string | null | undefined;
  gte?: string | null | undefined;
  in?: Array<string | null | undefined> | null | undefined;
  lt?: string | null | undefined;
  lte?: string | null | undefined;
  neq?: string | null | undefined;
  ngt?: string | null | undefined;
  ngte?: string | null | undefined;
  nin?: Array<string | null | undefined> | null | undefined;
  nlt?: string | null | undefined;
  nlte?: string | null | undefined;
};

export type WorkMode =
  | 'HYBRID'
  | 'ONSITE'
  | 'REMOTE';

export type WorkModeOperationFilterInput = {
  eq?: WorkMode | null | undefined;
  in?: Array<WorkMode> | null | undefined;
  neq?: WorkMode | null | undefined;
  nin?: Array<WorkMode> | null | undefined;
};

export type CandidatesQueryVariables = Exact<{
  where?: CandidateFilterInput | null | undefined;
}>;


export type CandidatesQuery = { candidates: { totalCount: number, nodes: Array<{ id: string, fullName: string, headline: string | null, yearsOfExperience: number, skills: Array<string>, applications: Array<{ id: string, stage: ApplicationStage }> }> | null } | null };

export type CandidateProfileQueryVariables = Exact<{
  id: string;
}>;


export type CandidateProfileQuery = { candidate: { id: string, fullName: string, email: string, headline: string | null, yearsOfExperience: number, skills: Array<string>, applications: Array<{ id: string, stage: ApplicationStage, appliedAt: string, job: { id: string, title: string, company: { name: string } }, skillMatch: { score: number, matchedSkills: Array<string>, missingSkills: Array<string> }, history: Array<{ from: ApplicationStage | null, to: ApplicationStage, note: string | null, changedAt: string }> }>, recommendedJobs: Array<{ job: { id: string, title: string, workMode: WorkMode, company: { name: string } }, match: { score: number, matchedSkills: Array<string>, missingSkills: Array<string> } }> } | null };

export type AgendaQueryVariables = Exact<{
  days?: number | null | undefined;
}>;


export type AgendaQuery = { upcomingInterviews: Array<{ id: string, kind: InterviewKind, scheduledAt: string, durationMinutes: number, interviewer: string, application: { id: string, candidate: { id: string, fullName: string }, job: { id: string, title: string } } }>, interviews: { nodes: Array<{ id: string, kind: InterviewKind, scheduledAt: string, interviewer: string, rating: number | null, feedback: string | null, application: { candidate: { id: string, fullName: string }, job: { title: string } } }> | null } | null };

export type JobBoardQueryVariables = Exact<{
  where?: JobPostingFilterInput | null | undefined;
  after?: string | null | undefined;
}>;


export type JobBoardQuery = { jobs: { totalCount: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: Array<{ id: string, title: string, location: string | null, workMode: WorkMode, employmentType: EmploymentType, status: JobStatus, requiredSkills: Array<string>, publishedAt: string | null, salary: { min: number, max: number, currency: string } | null, company: { id: string, name: string }, pipeline: { total: number } }> | null } | null };

export type JobDetailQueryVariables = Exact<{
  id: string;
}>;


export type JobDetailQuery = { job: { id: string, title: string, description: string, location: string | null, workMode: WorkMode, employmentType: EmploymentType, status: JobStatus, publishedAt: string | null, requiredSkills: Array<string>, salary: { min: number, max: number, currency: string } | null, company: { id: string, name: string, location: string | null }, pipeline: { total: number, hireRate: number, byStage: Array<{ stage: ApplicationStage, count: number }> }, applications: Array<{ id: string, stage: ApplicationStage, updatedAt: string, allowedNextStages: Array<ApplicationStage>, candidate: { id: string, fullName: string, headline: string | null }, skillMatch: { score: number, matchedSkills: Array<string> }, interviews: Array<{ kind: InterviewKind, scheduledAt: string }> }> } | null };

export type MoveApplicationMutationVariables = Exact<{
  applicationId: string;
  stage: ApplicationStage;
  note?: string | null | undefined;
}>;


export type MoveApplicationMutation = { moveApplication: { jobApplication: { id: string, stage: ApplicationStage, updatedAt: string, allowedNextStages: Array<ApplicationStage> } | null, errors: Array<
      | { __typename: 'DomainValidationError', message: string }
      | { __typename: 'EntityNotFoundError', message: string }
      | { __typename: 'InvalidStageTransitionError', message: string, allowedStages: Array<ApplicationStage> }
    > | null } };

export type PipelineActivitySubscriptionVariables = Exact<{
  jobPostingId: string;
}>;


export type PipelineActivitySubscription = { onApplicationStageChanged: { applicationId: string, from: ApplicationStage | null, to: ApplicationStage, note: string | null, changedAt: string, application: { id: string, candidate: { fullName: string } } } };


export const CandidatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Candidates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CandidateFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"candidates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"fullName"},"value":{"kind":"EnumValue","value":"ASC"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"yearsOfExperience"}},{"kind":"Field","name":{"kind":"Name","value":"skills"}},{"kind":"Field","name":{"kind":"Name","value":"applications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CandidatesQuery, CandidatesQueryVariables>;
export const CandidateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CandidateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"candidate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"headline"}},{"kind":"Field","name":{"kind":"Name","value":"yearsOfExperience"}},{"kind":"Field","name":{"kind":"Name","value":"skills"}},{"kind":"Field","name":{"kind":"Name","value":"applications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"company"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"skillMatch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"matchedSkills"}},{"kind":"Field","name":{"kind":"Name","value":"missingSkills"}}]}},{"kind":"Field","name":{"kind":"Name","value":"history"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"changedAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recommendedJobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"3"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"workMode"}},{"kind":"Field","name":{"kind":"Name","value":"company"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"match"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"matchedSkills"}},{"kind":"Field","name":{"kind":"Name","value":"missingSkills"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CandidateProfileQuery, CandidateProfileQueryVariables>;
export const AgendaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Agenda"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"days"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upcomingInterviews"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"days"},"value":{"kind":"Variable","name":{"kind":"Name","value":"days"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"interviewer"}},{"kind":"Field","name":{"kind":"Name","value":"application"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"interviews"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"rating"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"neq"},"value":{"kind":"NullValue"}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"scheduledAt"},"value":{"kind":"EnumValue","value":"DESC"}}]}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}},{"kind":"Field","name":{"kind":"Name","value":"interviewer"}},{"kind":"Field","name":{"kind":"Name","value":"rating"}},{"kind":"Field","name":{"kind":"Name","value":"feedback"}},{"kind":"Field","name":{"kind":"Name","value":"application"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"candidate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<AgendaQuery, AgendaQueryVariables>;
export const JobBoardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobBoard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"JobPostingFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"12"}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ListValue","values":[{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"publishedAt"},"value":{"kind":"EnumValue","value":"DESC"}}]}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"workMode"}},{"kind":"Field","name":{"kind":"Name","value":"employmentType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"requiredSkills"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"salary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"company"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]}}]}}]}}]} as unknown as DocumentNode<JobBoardQuery, JobBoardQueryVariables>;
export const JobDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"job"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"workMode"}},{"kind":"Field","name":{"kind":"Name","value":"employmentType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"requiredSkills"}},{"kind":"Field","name":{"kind":"Name","value":"salary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"min"}},{"kind":"Field","name":{"kind":"Name","value":"max"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"company"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"location"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pipeline"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hireRate"}},{"kind":"Field","name":{"kind":"Name","value":"byStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"applications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"allowedNextStages"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"headline"}}]}},{"kind":"Field","name":{"kind":"Name","value":"skillMatch"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"matchedSkills"}}]}},{"kind":"Field","name":{"kind":"Name","value":"interviews"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<JobDetailQuery, JobDetailQueryVariables>;
export const MoveApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MoveApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"stage"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApplicationStage"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"note"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveApplication"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"applicationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"applicationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"stage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"stage"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"note"},"value":{"kind":"Variable","name":{"kind":"Name","value":"note"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobApplication"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"allowedNextStages"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InvalidStageTransitionError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allowedStages"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MoveApplicationMutation, MoveApplicationMutationVariables>;
export const PipelineActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PipelineActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jobPostingId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onApplicationStageChanged"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"jobPostingId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jobPostingId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applicationId"}},{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"note"}},{"kind":"Field","name":{"kind":"Name","value":"changedAt"}},{"kind":"Field","name":{"kind":"Name","value":"application"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PipelineActivitySubscription, PipelineActivitySubscriptionVariables>;