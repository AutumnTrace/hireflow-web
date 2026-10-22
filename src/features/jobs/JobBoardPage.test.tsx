import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Provider } from 'urql'
import { createDemoClient } from '../../demo/client'
import { JobBoardPage } from './JobBoardPage'

function renderPage() {
  render(
    <Provider value={createDemoClient()}>
      <MemoryRouter>
        <JobBoardPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('JobBoardPage (against the demo schema)', () => {
  it('lists open postings with their companies', async () => {
    renderPage()

    expect(await screen.findByRole('link', { name: /Senior \.NET Engineer/ })).toBeInTheDocument()
    expect(screen.getByText('6 postings')).toBeInTheDocument()
    expect(screen.queryByText('ML Engineer')).not.toBeInTheDocument()
  })

  it('filters by work mode and search term', async () => {
    renderPage()
    await screen.findByText('6 postings')

    await userEvent.click(screen.getByRole('button', { name: 'Remote' }))
    expect(await screen.findByText('3 postings')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search job titles' }), 'React')
    expect(await screen.findByText('1 posting')).toBeInTheDocument()
    const list = screen.getByRole('list')
    expect(within(list).getByText('Frontend Engineer (React)')).toBeInTheDocument()
  })

  it('shows drafts and closed postings under "All"', async () => {
    renderPage()
    await screen.findByText('6 postings')

    await userEvent.click(screen.getByRole('button', { name: 'All' }))

    expect(await screen.findByText('8 postings')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })
})
