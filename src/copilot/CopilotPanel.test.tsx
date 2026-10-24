import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { ReactNode } from 'react'
import { ApiProvider, useApi } from '../api/ApiProvider'
import { Toaster } from '../components/Toaster'
import { CopilotPanel } from './CopilotPanel'
import { askCopilot } from './client'

// Live mode signs in to HireFlow first; here it gets a token and the in-browser engine instead.
vi.mock('../api/auth', () => ({ fetchDevToken: async () => 'test-token' }))
vi.mock('../api/client', async () => {
  const { createDemoClient } = await import('../demo/client')
  return { createLiveClient: () => ({ client: createDemoClient() }) }
})

/** Like the real layout: the panel only mounts once the GraphQL connection is ready. */
function WhenConnected({ children }: { children: ReactNode }) {
  return useApi().connection.status === 'ready' ? children : null
}

function renderPanel(mode: 'demo' | 'live') {
  return render(
    <ApiProvider initialSettings={{ mode, apiUrl: '', copilotUrl: 'http://copilot.test' }}>
      <Toaster>
        <MemoryRouter>
          <WhenConnected>
            <CopilotPanel onClose={() => {}} />
          </WhenConnected>
        </MemoryRouter>
      </Toaster>
    </ApiProvider>,
  )
}

describe('CopilotPanel in demo mode', () => {
  it('replays a recorded answer with linked sources', async () => {
    const user = userEvent.setup()
    renderPanel('demo')

    await user.click(await screen.findByRole('button', { name: /Why was Nicoleta Turcan rejected/ }))

    const turn = await screen.findByRole('region', { name: /Why was Nicoleta Turcan rejected/ })
    // In the answer, and again as the quoted text of the cited source.
    expect(within(turn).getAllByText(/Looking for more senior experience/).length).toBeGreaterThanOrEqual(2)
    const sources = within(turn).getByRole('list', { name: 'Sources' })
    expect(within(sources).getAllByRole('link')[0]).toHaveAttribute('href', expect.stringMatching(/^\/(jobs|candidates)\//))
    expect(screen.getByRole('textbox', { name: 'Ask the copilot' })).toBeDisabled()
  })

  it('applies a proposed stage change to the board', async () => {
    const user = userEvent.setup()
    renderPanel('demo')

    await user.click(await screen.findByRole('button', { name: /Move her Senior .NET application to the offer stage/ }))
    await user.click(await screen.findByRole('button', { name: 'Apply' }))

    expect(await screen.findByText('✓ Applied')).toBeInTheDocument()
    expect(screen.getByText('Moved to Offer')).toBeInTheDocument()
  })
})

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  askCopilot: vi.fn<typeof import('./client').askCopilot>(),
}))

describe('CopilotPanel in live mode', () => {
  it('sends free-text questions to the agent and shows API errors', async () => {
    const { CopilotError } = await import('./client')
    vi.mocked(askCopilot).mockRejectedValueOnce(new CopilotError('Rate limit: 5 requests per minute.', 42))
    const user = userEvent.setup()
    renderPanel('live')

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Ask the copilot' })).toBeEnabled())
    await user.type(screen.getByRole('textbox', { name: 'Ask the copilot' }), 'Who knows Kafka?')
    await user.click(screen.getByRole('button', { name: 'Ask' }))

    expect(askCopilot).toHaveBeenCalledWith('http://copilot.test', 'agent', 'Who knows Kafka?', expect.any(AbortSignal))
    expect(await screen.findByRole('alert')).toHaveTextContent('Rate limit: 5 requests per minute. Try again in 42s.')
  })
})
