import { test, expect } from '@playwright/test'

test.describe('Homepage smoke', () => {
  test('loads hero, services, team, lead form', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Media Omni|UpBase/i)
    await expect(page.locator('#hero')).toBeVisible()
    await expect(page.locator('#services')).toBeVisible()
    await expect(page.locator('#team')).toBeVisible()
    await expect(page.locator('#lead-form')).toBeVisible()
  })

  test('lead form validation: empty submit shows errors', async ({ page }) => {
    await page.goto('/#lead-form')
    await page.locator('button.lf-submit').click()
    await expect(page.locator('.lf-error').first()).toBeVisible()
  })

  test('case studies and blog pages reachable', async ({ page }) => {
    await page.goto('/case-studies')
    await expect(page).toHaveURL(/case-studies/)
    await page.goto('/blog')
    await expect(page).toHaveURL(/blog/)
  })
})
