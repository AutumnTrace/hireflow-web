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

describe('CopilotPanel replays after Apply', () => {
  const STRONGEST = /strongest candidates for the Senior .NET Engineer role/
  const MOVE_ANA = /Move her Senior .NET application to the offer stage/

  function ResetButton() {
    return <button onClick={useApi().reset}>Reset demo</button>
  }

  async function applyAnaToOffer(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: MOVE_ANA }))
    await user.click(await screen.findByRole('button', { name: 'Apply' }))
    await screen.findByText('✓ Applied')
  }

  it('flags a recorded answer that cites an application the user has since moved', async () => {
    const user = userEvent.setup()
    renderPanel('demo')

    await applyAnaToOffer(user)
    // The answer that proposed the move was recorded before it too, but it was asked before Apply.
    const proposing = screen.getByRole('region', { name: MOVE_ANA })
    expect(within(proposing).queryByRole('note')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: STRONGEST }))
    const replay = await screen.findByRole('region', { name: STRONGEST })
    expect(within(replay).getByRole('note')).toHaveTextContent('Recorded before you moved Ana Popescu to Offer.')
  })

  it('leaves answers about other applications alone', async () => {
    const user = userEvent.setup()
    renderPanel('demo')

    await applyAnaToOffer(user)
    await user.click(screen.getByRole('button', { name: /Why was Nicoleta Turcan rejected/ }))

    const replay = await screen.findByRole('region', { name: /Why was Nicoleta Turcan rejected/ })
    expect(within(replay).queryByRole('note')).not.toBeInTheDocument()
  })

  it('forgets applied moves on Reset demo', async () => {
    const user = userEvent.setup()
    render(
      <ApiProvider initialSettings={{ mode: 'demo', apiUrl: '', copilotUrl: 'http://copilot.test' }}>
        <Toaster>
          <MemoryRouter>
            <ResetButton />
            <WhenConnected>
              <CopilotPanel onClose={() => {}} />
            </WhenConnected>
          </MemoryRouter>
        </Toaster>
      </ApiProvider>,
    )

    await applyAnaToOffer(user)
    await user.click(screen.getByRole('button', { name: 'Reset demo' }))

    // The panel remounts on the fresh data; the same replay is accurate again.
    await user.click(await screen.findByRole('button', { name: STRONGEST }))
    const replay = await screen.findByRole('region', { name: STRONGEST })
    expect(within(replay).queryByRole('note')).not.toBeInTheDocument()
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
