import { graphql } from '../../gql'

export const CandidatesQuery = graphql(`
  query Candidates($where: CandidateFilterInput) {
    candidates(where: $where, first: 20, order: [{ fullName: ASC }]) {
      totalCount
      nodes {
        id
        fullName
        headline
        yearsOfExperience
        skills
        applications {
          id
          stage
        }
      }
    }
  }
`)

export const CandidateProfileQuery = graphql(`
  query CandidateProfile($id: UUID!) {
    candidate(id: $id) {
      id
      fullName
      email
      headline
      yearsOfExperience
      skills
      applications {
        id
        stage
        appliedAt
        job {
          id
          title
          company {
            name
          }
        }
        skillMatch {
          score
          matchedSkills
          missingSkills
        }
        history {
          from
          to
          note
          changedAt
        }
      }
      recommendedJobs(limit: 3) {
        job {
          id
          title
          workMode
          company {
            name
          }
        }
        match {
          score
          matchedSkills
          missingSkills
        }
      }
    }
  }
`)
