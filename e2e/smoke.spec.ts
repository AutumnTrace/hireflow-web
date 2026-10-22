import { expect, test } from '@playwright/test'

test('job board filters by work mode and search', async ({ page }) => {
  await page.goto('#/jobs')
  await expect(page.getByText('6 postings')).toBeVisible()

  await page.getByRole('button', { name: 'Remote' }).click()
  await expect(page.getByText('3 postings')).toBeVisible()

  await page.getByRole('searchbox', { name: 'Search job titles' }).fill('React')
  await expect(page.getByText('1 posting', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Frontend Engineer \(React\)/ })).toBeVisible()
})

test('candidate profile shows skill match and recommendations', async ({ page }) => {
  await page.goto('#/candidates')
  await page.getByRole('link', { name: /Ana Popescu/ }).click()

  await expect(page.getByRole('heading', { name: 'Ana Popescu' })).toBeVisible()
  await expect(page.getByRole('meter', { name: 'Skill match for Senior .NET Engineer' })).toHaveAttribute('value', '0.5')
  await expect(page.getByRole('heading', { name: 'Recommended jobs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Backend Intern' })).toBeVisible()
})

test('interview agenda lists upcoming interviews', async ({ page }) => {
  await page.goto('#/interviews')
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
  await expect(page.getByText('Technical with Ana Popescu')).toBeVisible()
})

test('data source can be switched in settings', async ({ page }) => {
  await page.goto('#/jobs')
  await page.getByRole('button', { name: /Demo data ⚙/ }).click()

  const dialog = page.getByRole('dialog', { name: 'Data source' })
  await dialog.getByLabel('Live API').check()
  await expect(dialog.getByLabel('API URL')).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
})
