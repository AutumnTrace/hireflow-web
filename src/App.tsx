import { Navigate, RouterProvider, createHashRouter } from 'react-router'
import { ApiProvider } from './api/ApiProvider'
import { Layout } from './components/Layout'
import { Toaster } from './components/Toaster'
import { EmptyState } from './components/ui'
import { CandidatePage } from './features/candidates/CandidatePage'
import { CandidatesPage } from './features/candidates/CandidatesPage'
import { InterviewsPage } from './features/interviews/InterviewsPage'
import { JobBoardPage } from './features/jobs/JobBoardPage'
import { JobDetailPage } from './features/jobs/JobDetailPage'

// Hash routing keeps deep links working on static hosts such as GitHub Pages.
const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/jobs" replace /> },
      { path: 'jobs', element: <JobBoardPage /> },
      { path: 'jobs/:jobId', element: <JobDetailPage /> },
      { path: 'candidates', element: <CandidatesPage /> },
      { path: 'candidates/:candidateId', element: <CandidatePage /> },
      { path: 'interviews', element: <InterviewsPage /> },
      { path: '*', element: <EmptyState title="Page not found" /> },
    ],
  },
])

export default function App() {
  return (
    <ApiProvider>
      <Toaster>
        <RouterProvider router={router} />
      </Toaster>
    </ApiProvider>
  )
}
