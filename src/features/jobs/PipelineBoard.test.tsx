import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { PipelineBoard, type BoardApplication, type PipelineBoardProps } from './PipelineBoard'

const applications: BoardApplication[] = [
  {
    id: 'a1',
    stage: 'APPLIED',
    updatedAt: new Date().toISOString(),
    allowedNextStages: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
    candidate: { id: 'c1', fullName: 'Ana Popescu' },
    skillMatch: { score: 0.5 },
  },
  {
    id: 'a2',
    stage: 'HIRED',
    updatedAt: new Date().toISOString(),
    allowedNextStages: [],
    candidate: { id: 'c2', fullName: 'Elena Ciobanu' },
    skillMatch: { score: 1 },
  },
]

function renderBoard(onMove = vi.fn<PipelineBoardProps['onMove']>()) {
  render(
    <MemoryRouter>
      <PipelineBoard applications={applications} onMove={onMove} />
    </MemoryRouter>,
  )
  return onMove
}

describe('PipelineBoard', () => {
  it('renders one labelled column per stage with counts', () => {
    renderBoard()

    expect(screen.getByRole('region', { name: 'Applied column, 1 applicant' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Hired column, 1 applicant' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Offer column, 0 applicants' })).toBeInTheDocument()
  })

  it('offers only the allowed next stages in the accessible move menu', () => {
    renderBoard()

    const menu = screen.getByRole('combobox', { name: 'Move Ana Popescu to' })
    expect(within(menu).getAllByRole('option').map((o) => o.textContent)).toEqual(['Move ▾', 'Screening', 'Rejected', 'Withdrawn'])
  })

  it('hides the move menu for applications in a final stage', () => {
    renderBoard()
    expect(screen.queryByRole('combobox', { name: 'Move Elena Ciobanu to' })).not.toBeInTheDocument()
  })

  it('reports the chosen move', async () => {
    const onMove = renderBoard()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Move Ana Popescu to' }), 'SCREENING')

    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a1' }), 'SCREENING')
  })
})
