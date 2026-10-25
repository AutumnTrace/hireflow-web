import { graphql } from '../../gql'

export const JobBoardQuery = graphql(`
  query JobBoard($where: JobPostingFilterInput, $after: String) {
    jobs(where: $where, first: 12, after: $after, order: [{ publishedAt: DESC }]) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        location
        workMode
        employmentType
        status
        requiredSkills
        publishedAt
        salary {
          min
          max
          currency
        }
        company {
          id
          name
        }
        pipeline {
          total
        }
      }
    }
  }
`)

export const JobDetailQuery = graphql(`
  query JobDetail($id: UUID!) {
    job(id: $id) {
      id
      title
      description
      location
      workMode
      employmentType
      status
      publishedAt
      requiredSkills
      salary {
        min
        max
        currency
      }
      company {
        id
        name
        location
      }
      pipeline {
        total
        hireRate
        byStage {
          stage
          count
        }
      }
      applications {
        id
        stage
        updatedAt
        allowedNextStages
        candidate {
          id
          fullName
          headline
        }
        skillMatch {
          score
          matchedSkills
        }
        interviews {
          kind
          scheduledAt
        }
      }
    }
  }
`)

export const MoveApplicationMutation = graphql(`
  mutation MoveApplication($applicationId: UUID!, $stage: ApplicationStage!, $note: String) {
    moveApplication(input: { applicationId: $applicationId, stage: $stage, note: $note }) {
      jobApplication {
        id
        stage
        updatedAt
        allowedNextStages
        candidate {
          id
          fullName
        }
      }
      errors {
        __typename
        ... on Error {
          message
        }
        ... on InvalidStageTransitionError {
          allowedStages
        }
      }
    }
  }
`)

export const PipelineActivitySubscriptionDocument = graphql(`
  subscription PipelineActivity($jobPostingId: UUID!) {
    onApplicationStageChanged(jobPostingId: $jobPostingId) {
      applicationId
      from
      to
      note
      changedAt
      application {
        id
        candidate {
          fullName
        }
      }
    }
  }
`)
