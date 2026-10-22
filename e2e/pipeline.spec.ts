import { expect, test, type Page } from '@playwright/test'

async function openSeniorNetJob(page: Page) {
  await page.goto('#/jobs')
  await page.getByRole('link', { name: /Senior \.NET Engineer/ }).click()
  await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible()
}

/** Drags a card with a real mouse, the way a user would. */
async function dragCard(page: Page, candidate: string, stage: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${candidate},`) })
  const column = page.locator(`section[data-stage="${stage}"]`)
  const from = (await card.boundingBox())!
  const to = (await column.boundingBox())!

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 })
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 15 })
  await page.mouse.up()
}

const column = (page: Page, stage: string) => page.locator(`section[data-stage="${stage}"]`)

test('moving a candidate updates the board, the chart and the live feed', async ({ page }) => {
  await openSeniorNetJob(page)
  await expect(column(page, 'APPLIED')).toHaveAttribute('aria-label', 'Applied column, 2 applicants')

  await page.getByRole('combobox', { name: 'Move Radu Stoica to' }).selectOption('SCREENING')

  await expect(page.getByRole('status').filter({ hasText: 'Radu Stoica → Screening' })).toBeVisible()
  await expect(column(page, 'SCREENING')).toContainText('Radu Stoica')
  await expect(column(page, 'APPLIED')).toHaveAttribute('aria-label', 'Applied column, 1 applicant')
  await expect(page.getByRole('region', { name: 'Live activity' }).or(page.locator('[aria-labelledby="activity-title"]')))
    .toContainText('Radu Stoica moved from Applied to Screening')
  await expect(page.getByRole('table', { name: 'Applicants per stage' })).toContainText('Screening2')
})

test('dragging to an allowed column moves the card', async ({ page }) => {
  await openSeniorNetJob(page)

  await dragCard(page, 'Ana Popescu', 'OFFER')

  await expect(column(page, 'OFFER')).toContainText('Ana Popescu')
  await expect(column(page, 'INTERVIEW')).not.toContainText('Ana Popescu')
})

test('an illegal drop shows the typed error from the API and leaves the card in place', async ({ page }) => {
  await openSeniorNetJob(page)

  await dragCard(page, 'Ana Popescu', 'HIRED')

  const alert = page.getByRole('alert').filter({ hasText: "Can't move Ana Popescu" })
  await expect(alert).toContainText('Cannot move an application from Interview to Hired. Allowed: Offer, Rejected, Withdrawn.')
  await expect(column(page, 'INTERVIEW')).toContainText('Ana Popescu')
  await expect(column(page, 'HIRED')).not.toContainText('Ana Popescu')
})

test('reset demo restores the sample data', async ({ page }) => {
  await openSeniorNetJob(page)
  await page.getByRole('combobox', { name: 'Move Radu Stoica to' }).selectOption('REJECTED')
  await expect(column(page, 'REJECTED')).toContainText('Radu Stoica')

  await page.getByRole('button', { name: /Reset demo/ }).click()

  await expect(column(page, 'APPLIED')).toContainText('Radu Stoica')
})
