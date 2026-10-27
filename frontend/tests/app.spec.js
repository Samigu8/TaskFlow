import { test, expect } from '@playwright/test'

test('user can register, create, search, complete, and delete a task', async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const email = `browser-${suffix}@example.com`

  await page.goto('/')
  await page.getByRole('button', { name: 'Need an account? Register' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('browser-password-123')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Your tasks' })).toBeVisible()
  await page.getByLabel('Title').fill('Browser E2E task')
  await page.getByLabel('Description').fill('Search and status verification')
  await page.locator('form select[name="priority"]').selectOption('HIGH')
  await page.getByRole('button', { name: 'Add task' }).click()

  await expect(page.getByRole('heading', { name: 'Browser E2E task' })).toBeVisible()
  await page.getByLabel('Search tasks').fill('Browser E2E')
  await expect(page.getByRole('heading', { name: 'Browser E2E task' })).toBeVisible()

  const status = page.getByLabel('Status for Browser E2E task')
  await status.selectOption('COMPLETED')
  await expect(status).toHaveValue('COMPLETED')

  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No tasks yet. Add your first one.')).toBeVisible()
})
