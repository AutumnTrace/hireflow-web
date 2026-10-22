import { graphql } from '../../gql'

export const AgendaQuery = graphql(`
  query Agenda($days: Int) {
    upcomingInterviews(days: $days) {
      id
      kind
      scheduledAt
      durationMinutes
      interviewer
      application {
        id
        candidate {
          id
          fullName
        }
        job {
          id
          title
        }
      }
    }
    interviews(where: { rating: { neq: null } }, order: [{ scheduledAt: DESC }], first: 10) {
      nodes {
        id
        kind
        scheduledAt
        interviewer
        rating
        feedback
        application {
          candidate {
            id
            fullName
          }
          job {
            title
          }
        }
      }
    }
  }
`)
