import { expect, test } from '@playwright/test'

test('copilot answers with citations that open the cited record', async ({ page }) => {
  await page.goto('#/jobs')
  await page.getByRole('button', { name: /Copilot/ }).click()

  const panel = page.getByRole('complementary', { name: 'Copilot' })
  await expect(panel).toContainText('Recorded answers from')
  await panel.getByRole('button', { name: /strongest candidates for the Senior \.NET Engineer/ }).click()

  const turn = panel.getByRole('region', { name: /strongest candidates/ })
  await expect(turn).toContainText('Daria Munteanu')
  await expect(turn.getByText('get_job_pipeline')).toBeVisible()

  // Clicking a [n] marker opens the source list on that source.
  await turn.getByRole('button', { name: '[1]' }).first().click()
  const sources = turn.getByRole('list', { name: 'Sources' })
  await expect(sources).toBeVisible()
  await sources.getByRole('link').first().click()
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible()
})

test('applying a copilot proposal moves the card on the board', async ({ page }) => {
  await page.goto('#/jobs')
  await page.getByRole('link', { name: /Senior \.NET Engineer/ }).click()
  await expect(page.locator('section[data-stage="INTERVIEW"]')).toContainText('Ana Popescu')

  await page.getByRole('button', { name: /Copilot/ }).click()
  const panel = page.getByRole('complementary', { name: 'Copilot' })
  await panel.getByRole('button', { name: /Move her Senior \.NET application to the offer stage/ }).click()
  await expect(panel).toContainText('Proposed change')
  await panel.getByRole('button', { name: 'Apply' }).click()

  await expect(panel.getByText('✓ Applied')).toBeVisible()
  await expect(page.locator('section[data-stage="OFFER"]')).toContainText('Ana Popescu')
})
